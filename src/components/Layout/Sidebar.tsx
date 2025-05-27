'use client';

import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    CalendarOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => router.push('/dashboard'),
        },
        {
            key: '/dashboard/clients',
            icon: <UserOutlined />,
            label: 'Clients',
            onClick: () => router.push('/dashboard/clients'),
        },
        {
            key: '/dashboard/invoices',
            icon: <FileTextOutlined />,
            label: 'Factures',
            onClick: () => router.push('/dashboard'),
        },
        {
            key: '/dashboard/booking',
            icon: <CalendarOutlined />,
            label: 'Bookings',
            onClick: () => router.push('/dashboard/booking'),
        },
        {
            key: '/dashboard/settings',
            icon: <SettingOutlined />,
            label: 'Paramètres',
            onClick: () => router.push('/dashboard'),
        },
    ];

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            collapsedWidth={80}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#fff',
                boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)'
            }}
        >
            <div style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #f0f0f0'
            }}>
                {collapsed ? (
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>FA</div>
                ) : (
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>Facturation App</div>
                )}
            </div>

            <Menu
                theme="light"
                mode="inline"
                selectedKeys={[pathname]}
                items={items}
                style={{ borderRight: 0 }}
            />
        </Sider>
    );
}