import React from 'react';
import { Layout as TLayout, Menu } from 'tdesign-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DashboardIcon, ChartIcon } from 'tdesign-icons-react';
import styles from './Layout.module.less';

const { Header, Aside, Content } = TLayout;

export function Layout() {
  const navigate = useNavigate();

  return (
    <TLayout className={styles.layout}>
      <Header>Track Platform</Header>
      <TLayout>
        <Aside>
          <Menu
            theme="light"
            value="/dashboard"
            options={[
              {
                content: '仪表盘',
                value: '/dashboard',
                icon: <DashboardIcon />,
              },
              {
                content: '事件分析',
                value: '/event-analysis',
                icon: <ChartIcon />,
              }
            ]}
            onChange={(value) => navigate(value as string)}
          />
        </Aside>
        <Content>
          <Outlet />
        </Content>
      </TLayout>
    </TLayout>
  );
} 