'use client';

import { Layout } from 'antd';
import { useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Topbar from '@/components/Layout/Topbar';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

const { Content } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
                <Sidebar collapsed={collapsed} />
                <Layout style={{
                    marginLeft: collapsed ? 80 : 240,
                    transition: 'all 0.2s'
                }}>
                    <Topbar collapsed={collapsed} setCollapsed={setCollapsed} />
                    <Content style={{
                        margin: '24px 16px',
                        padding: 24,
                        background: '#fff',
                        minHeight: 280,
                        overflow: 'initial'
                    }}>
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </ProtectedRoute>
    );
}