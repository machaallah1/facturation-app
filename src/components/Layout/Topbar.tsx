'use client';

import { Layout, Menu, Dropdown, Avatar, Input, Button, Badge } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SearchOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

const { Header } = Layout;

export default function Topbar({ collapsed, setCollapsed }: {
    collapsed: boolean,
    setCollapsed: (collapsed: boolean) => void
}) {
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: 'Profil',
            icon: <UserOutlined />,
        },
        {
            key: '2',
            label: 'Déconnexion',
            icon: <LogoutOutlined />,
            onClick: () => signOut(auth),
        },
    ];

    return (
        <Header style={{
            padding: 0,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ width: 64, height: 64 }}
                />
                <Input
                    placeholder="Rechercher..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300, marginLeft: 16 }}
                />
            </div>

            <div style={{ marginRight: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Badge count={5}>
                    <Button type="text" icon={<BellOutlined />} size="large" />
                </Badge>

                <Dropdown menu={{ items }} placement="bottomRight">
                    <Avatar
                        icon={<UserOutlined />}
                        style={{ cursor: 'pointer' }}
                    />
                </Dropdown>
            </div>
        </Header>
    );
}