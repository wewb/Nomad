import { Event } from '../models/Event';
import mongoose from 'mongoose';

export class StatisticsService {
  // 基础统计指标
  static async getBasicMetrics(projectId: string, startDate: Date, endDate: Date) {
    const match = {
      projectId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const result = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$userEnvInfo.uid' },
          avgDuration: { $avg: '$data.events.data.duration' },
          totalPageViews: {
            $sum: {
              $size: {
                $filter: {
                  input: '$data.events',
                  as: 'event',
                  cond: { $eq: ['$$event.type', 'view'] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSessions: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          avgDuration: 1,
          totalPageViews: 1
        }
      }
    ]);

    return result[0] || {
      totalSessions: 0,
      uniqueVisitors: 0,
      avgDuration: 0,
      totalPageViews: 0
    };
  }

  // 用户环境分析
  static async getEnvironmentMetrics(projectId: string, startDate: Date, endDate: Date) {
    const match = {
      projectId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const [browsers, devices, languages, referrers] = await Promise.all([
      // 浏览器分布
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              name: '$userEnvInfo.browserName',
              version: '$userEnvInfo.browserVersion'
            },
            count: { $sum: 1 }
          }
        }
      ]),

      // 设备分布
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              type: '$userEnvInfo.deviceType',
              os: '$userEnvInfo.osName'
            },
            count: { $sum: 1 }
          }
        }
      ]),

      // 语言分布
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$userEnvInfo.language',
            count: { $sum: 1 }
          }
        }
      ]),

      // 来源分布
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$data.referrer',
            visits: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userEnvInfo.uid' }
          }
        },
        {
          $project: {
            source: { $ifNull: ['$_id', '直接访问'] },
            visits: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            _id: 0
          }
        },
        { $sort: { visits: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      browsers: browsers.map(b => ({
        name: b?._id?.name || 'Unknown',
        version: b?._id?.version || '',
        count: b?.count || 0
      })),
      devices: devices.map(d => ({
        type: d?._id?.type || 'Unknown',
        os: d?._id?.os || 'Unknown',
        count: d?.count || 0
      })),
      languages: languages.map(l => ({
        code: l?._id || 'unknown',
        count: l?.count || 0
      })),
      referrers: referrers.map(r => ({
        source: r?.source || '[本机浏览]',
        visits: r?.visits || 0,
        uniqueUsers: r?.uniqueUsers || 0
      }))
    };
  }

  // 用户行为分析
  static async getBehaviorMetrics(projectId: string, startDate: Date, endDate: Date) {
    const match = {
      projectId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const [clickEvents, searchEvents] = await Promise.all([
      // 点击事件分析
      Event.aggregate([
        { $match: match },
        { $unwind: '$data.events' },
        { $match: { 'data.events.type': 'click' } },
        {
          $group: {
            _id: '$data.events.data.element',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userEnvInfo.uid' }
          }
        },
        {
          $project: {
            _id: 0,
            element: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        }
      ]),

      // 搜索事件分析
      Event.aggregate([
        { $match: match },
        { $unwind: '$data.events' },
        { $match: { 'data.events.type': 'custom', 'data.events.data.keyword': { $exists: true } } },
        {
          $group: {
            _id: '$data.events.data.keyword',
            frequency: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            keyword: '$_id',
            frequency: 1
          }
        }
      ])
    ]);

    return { clickEvents, searchEvents };
  }

  // 时间维度分析
  static async getTimeMetrics(projectId: string, startDate: Date, endDate: Date, interval: 'day' | 'week' | 'month' = 'day') {
    const match = {
      projectId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const groupByDate = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    };

    const trends = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupByDate[interval],
          views: {
            $sum: {
              $size: {
                $filter: {
                  input: '$data.events',
                  as: 'event',
                  cond: { $eq: ['$$event.type', 'view'] }
                }
              }
            }
          },
          users: { $addToSet: '$userEnvInfo.uid' },
          totalEvents: { $sum: { $size: '$data.events' } }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          views: 1,
          users: { $size: '$users' },
          events: '$totalEvents'
        }
      },
      { $sort: { date: 1 } }
    ]);

    // 计算同环比
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const [currentPeriod, previousPeriod] = await Promise.all([
      Event.countDocuments({ ...match }),
      Event.countDocuments({
        projectId,
        createdAt: {
          $gte: previousPeriodStart,
          $lt: startDate
        }
      })
    ]);

    const comparison = {
      current: currentPeriod,
      previous: previousPeriod,
      change: previousPeriod ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0
    };

    return { trends, comparison };
  }

  // 用户路径分析
  static async getPathAnalysis(projectId: string, startDate: Date, endDate: Date) {
    const match = {
      projectId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const [entryPages, exitPages, userFlows] = await Promise.all([
      // 入口页面分析
      Event.aggregate([
        { $match: match },
        { $sort: { 'data.events.timestamp': 1 } },
        {
          $group: {
            _id: '$data.pageUrl',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            url: '$_id',
            count: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // 退出页面分析
      Event.aggregate([
        { $match: match },
        { $sort: { 'data.events.timestamp': -1 } },
        {
          $group: {
            _id: '$data.pageUrl',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            url: '$_id',
            count: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // 用户路径流分析
      Event.aggregate([
        { $match: match },
        { $unwind: '$data.events' },
        { $match: { 'data.events.type': 'view' } },
        {
          $group: {
            _id: {
              sessionId: '$_id',
              uid: '$userEnvInfo.uid'
            },
            path: { $push: '$data.events.data.pageUrl' }
          }
        },
        { $unwind: { path: '$path', includeArrayIndex: 'index' } },
        {
          $group: {
            _id: {
              from: '$path',
              to: {
                $arrayElemAt: ['$path', { $add: ['$index', 1] }]
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            from: '$_id.from',
            to: '$_id.to',
            count: 1
          }
        },
        { $match: { to: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    return {
      entryPages,
      exitPages,
      userFlows
    };
  }

  // 转化漏斗分析
  static async getFunnelAnalysis(
    projectId: string, 
    startDate: Date, 
    endDate: Date,
    steps: Array<{
      name: string;
      eventType: string;
      conditions?: Record<string, any>;
    }>
  ) {
    const match = {
      projectId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // 获取每个步骤的用户数
    const stepsData = await Promise.all(
      steps.map(async (step, index) => {
        const eventMatch = {
          'data.events.type': step.eventType,
          ...(step.conditions && { 'data.events.data': step.conditions })
        };

        let users = await Event.aggregate([
          { $match: match },
          { $unwind: '$data.events' },
          { $match: eventMatch },
          {
            $group: {
              _id: '$userEnvInfo.uid',
              timestamp: { $first: '$data.events.timestamp' }
            }
          }
        ]);

        // 如果不是第一步，需要检查用户是否完成了前一步
        if (index > 0) {
          const prevStep = steps[index - 1];
          const prevEventMatch = {
            'data.events.type': prevStep.eventType,
            ...(prevStep.conditions && { 'data.events.data': prevStep.conditions })
          };

          const prevUsers = await Event.aggregate([
            { $match: match },
            { $unwind: '$data.events' },
            { $match: prevEventMatch },
            {
              $group: {
                _id: '$userEnvInfo.uid',
                timestamp: { $first: '$data.events.timestamp' }
              }
            }
          ]);

          const prevUserIds = new Set(prevUsers.map(u => u._id));
          users = users.filter(u => prevUserIds.has(u._id));
        }

        return {
          name: step.name,
          eventType: step.eventType,
          count: users.length,
          users: users.map(u => ({ uid: u._id, timestamp: u.timestamp }))
        };
      })
    );

    // 计算转化率和流失率
    const funnelData = stepsData.map((step, index) => {
      const prevCount = index > 0 ? stepsData[index - 1].count : step.count;
      const conversionRate = prevCount ? (step.count / prevCount) * 100 : 100;
      const dropoffRate = 100 - conversionRate;

      return {
        ...step,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        dropoffRate: parseFloat(dropoffRate.toFixed(2)),
        dropoffCount: prevCount - step.count
      };
    });

    // 计算整体转化率
    const overallConversion = stepsData.length > 1 
      ? (stepsData[stepsData.length - 1].count / stepsData[0].count) * 100 
      : 100;

    return {
      steps: funnelData,
      totalUsers: stepsData[0].count,
      completedUsers: stepsData[stepsData.length - 1].count,
      overallConversion: parseFloat(overallConversion.toFixed(2))
    };
  }

  // 获取事件分析数据
  static async getEventAnalysis(projectId: string, startDate: Date, endDate: Date) {
    try {
      console.log('Starting getEventAnalysis with:', { projectId, startDate, endDate });

      // 验证输入参数
      if (!projectId || !startDate || !endDate) {
        throw new Error('Missing required parameters');
      }

      // 确保日期格式正确
      const start = new Date(startDate);
      const end = new Date(endDate);

      const match = {
        projectId,
        createdAt: { $gte: start, $lte: end }
      };

      console.log('Executing aggregation with match:', match);

      const [eventStats, userBehaviorData, envMetrics] = await Promise.all([
        // 事件基础统计
        Event.aggregate([
          { $match: match },
          { $unwind: '$data.events' },
          {
            $group: {
              _id: '$data.events.type',
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userEnvInfo.uid' },
              avgDuration: { $avg: '$data.events.data.duration' },
              lastTriggered: { $max: '$createdAt' }
            }
          },
          {
            $project: {
              _id: 0,
              eventName: '$_id',
              eventType: {
                $cond: {
                  if: { $in: ['$_id', ['view', 'click', 'error']] },
                  then: 'system',
                  else: 'custom'
                }
              },
              count: 1,
              uniqueUsers: { $size: '$uniqueUsers' },
              avgDuration: 1,
              lastTriggered: 1
            }
          }
        ]).exec(),

        // 用户行为分析
        Event.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$userEnvInfo.uid',
              sessionCount: { $sum: 1 },
              avgSessionDuration: { $avg: { $ifNull: ['$data.duration', 0] } },
              totalPageViews: {
                $sum: {
                  $size: {
                    $ifNull: [
                      {
                        $filter: {
                          input: { $ifNull: ['$data.events', []] },
                          as: 'event',
                          cond: { $eq: ['$$event.type', 'view'] }
                        }
                      },
                      []
                    ]
                  }
                }
              }
            }
          }
        ]).exec(),

        // 环境指标
        this.getEnvironmentMetrics(projectId, start, end)
      ]);

      console.log('Raw aggregation results:', {
        eventStatsCount: eventStats?.length,
        userBehaviorCount: userBehaviorData?.length,
        envMetricsExists: !!envMetrics
      });

      // 处理用户行为数据
      const userBehavior = {
        totalUsers: userBehaviorData?.length || 0,
        avgSessionsPerUser: userBehaviorData?.length ? 
          userBehaviorData.reduce((acc, cur) => acc + (cur.sessionCount || 0), 0) / userBehaviorData.length : 0,
        avgSessionDuration: userBehaviorData?.length ? 
          userBehaviorData.reduce((acc, cur) => acc + (cur.avgSessionDuration || 0), 0) / userBehaviorData.length : 0,
        avgPageViewsPerSession: userBehaviorData?.length ? 
          userBehaviorData.reduce((acc, cur) => acc + (cur.totalPageViews || 0), 0) / userBehaviorData.length : 0
      };

      // 添加用户行为趋势统计
      const behaviorTrends = await Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            },
            visits: { $sum: 1 },
            users: { $addToSet: "$userEnvInfo.uid" },
            pageViews: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$data.events",
                    as: "event",
                    cond: { $eq: ["$$event.type", "view"] }
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            visits: 1,
            users: { $size: "$users" },
            pageViews: 1
          }
        },
        { $sort: { date: 1 } }
      ]);

      const result = {
        eventStats: eventStats || [],
        userBehavior,
        sourceAnalysis: {
          referrers: envMetrics?.referrers || [],
          browsers: envMetrics?.browsers || [],
          devices: envMetrics?.devices || [],
          languages: envMetrics?.languages || []
        },
        behaviorTrends
      };

      console.log('Processed result structure:', {
        hasEventStats: result.eventStats.length > 0,
        hasUserBehavior: result.userBehavior.totalUsers > 0,
        hasSourceAnalysis: {
          referrers: result.sourceAnalysis.referrers.length,
          browsers: result.sourceAnalysis.browsers.length,
          devices: result.sourceAnalysis.devices.length,
          languages: result.sourceAnalysis.languages.length
        }
      });

      return result;

    } catch (error) {
      console.error('Detailed error in getEventAnalysis:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        startDate,
        endDate
      });
      throw error;
    }
  }
} 