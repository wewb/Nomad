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

    const [browsers, devices, languages] = await Promise.all([
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
        },
        {
          $project: {
            _id: 0,
            name: '$_id.name',
            version: '$_id.version',
            count: 1
          }
        }
      ]),

      // 设备类型分布
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$userEnvInfo.deviceType',
            count: { $sum: 1 }
          }
        }
      ]),

      // 语言偏好
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$userEnvInfo.language',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return { browsers, devices, languages };
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

        const users = await Event.aggregate([
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
} 