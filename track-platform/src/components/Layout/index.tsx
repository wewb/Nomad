import React from 'react';
import { Layout as TLayout, Menu } from 'tdesign-react';
import { Link } from 'react-router-dom';
import { DashboardIcon, SettingIcon } from 'tdesign-icons-react';
import styles from './Layout.module.css';

const { Header, Aside, Content } = TLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <TLayout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>Track Platform</div>
      </Header>
      <TLayout>
        <Aside width="200px">
          <Menu theme="light">
            <Menu.MenuItem icon={<DashboardIcon />} value="dashboard">
              <Link to="/">Dashboard</Link>
            </Menu.MenuItem>
            <Menu.MenuItem icon={<SettingIcon />} value="events">
              <Link to="/events">Event Management</Link>
            </Menu.MenuItem>
          </Menu>
        </Aside>
        <Content className={styles.content}>
          {children}
        </Content>
      </TLayout>
    </TLayout>
  );
};

export default Layout; 