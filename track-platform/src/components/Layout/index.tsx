import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { DashboardOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './Layout.module.css';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntLayout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>Track Platform</div>
      </Header>
      <AntLayout>
        <Sider width={200}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            style={{ height: '100%' }}
          >
            <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="events" icon={<SettingOutlined />}>
              <Link to="/events">Event Management</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Content className={styles.content}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 