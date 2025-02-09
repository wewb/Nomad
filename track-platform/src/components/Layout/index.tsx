import React from 'react';
import { Layout as TLayout, Menu } from 'tdesign-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardIcon, 
  ChartIcon, 
  AppIcon,
  SettingIcon,
  SearchIcon,
  UserCircleIcon,
  HelpCircleIcon
} from 'tdesign-icons-react';
import styles from './Layout.module.less';

const { Header, Content, Aside } = TLayout;
const { HeadMenu, MenuItem, MenuGroup } = Menu;

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <TLayout className={styles.layout}>
      <Header>
        <HeadMenu
          value={location.pathname}
          logo={<div className="logo">Track Platform</div>}
          operations={
            <div className="header-operations">
              <SearchIcon className="header-icon" />
              <UserCircleIcon className="header-icon" />
              <HelpCircleIcon className="header-icon" />
            </div>
          }
          onChange={(value) => navigate(value as string)}
        >
          <MenuItem value="/dashboard">数据概览</MenuItem>
          <MenuItem value="/events">事件列表</MenuItem>
          <MenuItem value="/event-analysis">事件分析</MenuItem>
        </HeadMenu>
      </Header>
      <TLayout>
        <Aside style={{ borderRight: '1px solid var(--td-component-border)' }}>
          <Menu
            theme="light"
            value={location.pathname}
            onChange={(value) => navigate(value as string)}
            style={{ height: '100%' }}
          >
            <MenuGroup title="数据概览">
              <MenuItem value="/dashboard" icon={<DashboardIcon />}>
                仪表盘
              </MenuItem>
              <MenuItem value="/events" icon={<AppIcon />}>
                事件列表
              </MenuItem>
              <MenuItem value="/event-analysis" icon={<ChartIcon />}>
                事件分析
              </MenuItem>
            </MenuGroup>
            <MenuGroup title="项目管理">
              <MenuItem value="/apps" icon={<AppIcon />}>
                应用列表
              </MenuItem>
              <MenuItem value="/settings" icon={<SettingIcon />}>
                系统设置
              </MenuItem>
            </MenuGroup>
          </Menu>
        </Aside>
        <Content>
          <Outlet />
        </Content>
      </TLayout>
    </TLayout>
  );
} 