import React, { useState, useEffect } from 'react';
import { Card, Row, Col, MessagePlugin } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';
import { ChartIcon } from 'tdesign-icons-react';
import request from '../../utils/request';
import './style.less';

interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string;
}

export function ProjectSelect() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await request.get<Project[]>('/api/app/list');
        setProjects(response);
      } catch (error) {
        MessagePlugin.error('获取应用列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="project-select">
      <Card title="选择应用" loading={loading}>
        <Row gutter={[16, 16]}>
          {projects.map(project => (
            <Col key={project.id} span={16}>
              <div onClick={() => navigate(`/event-analysis/${project.projectId}`)}>
                <Card
                  className="project-card"
                  hoverShadow
                  bordered
                >
                  <div className="project-icon">
                    <ChartIcon size="28px" />
                  </div>
                  <div className="project-name">{project.name}</div>
                  <div className="project-desc">{project.description || '暂无描述'}</div>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
} 