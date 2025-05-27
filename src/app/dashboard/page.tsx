'use client';

import { Typography, Card, Row, Col } from 'antd';

const { Title, Text } = Typography;

export default function DashboardPage() {
    return (
        <div>
            <Title level={2}>Tableau de bord</Title>

            <Row gutter={16}>
                <Col span={8}>
                    <Card title="Statistiques">
                        <Text>Contenu de la carte</Text>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Dernières activités">
                        <Text>Liste des activités</Text>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Notifications">
                        <Text>Alertes récentes</Text>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}