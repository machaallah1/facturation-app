'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Divider, List, Typography } from 'antd';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { DollarOutlined, ShoppingOutlined, UserOutlined, ContainerOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalBookings: 0,
        totalClients: 0,
        totalFactures: 0,
        totalTransport: 0,
        totalManutention: 0,
        totalGlobal: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Récupérer les bookings
                const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
                const bookings = bookingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Récupérer les clients
                const clientsSnapshot = await getDocs(collection(db, 'clients'));
                const clients = clientsSnapshot.docs.length;

                // Récupérer les factures
                const facturesSnapshot = await getDocs(collection(db, 'factures'));
                const factures = facturesSnapshot.docs.length;

                // Calculer les totaux des bookings
                const totals = bookings.reduce((acc, booking) => {
                    const transport = booking.nombreTC * booking.fraisTransport;
                    const fauxFrais = booking.nombreTC * booking.fauxFrais;
                    let manutention = 0;

                    if (booking.typeProduit === 'matiere_premiere') {
                        manutention = booking.manutention.facture + 
                                    booking.manutention.dfu + 
                                    booking.manutention.honoraire + 
                                    booking.manutention.caution;
                    } else if (booking.typeProduit === 'semi_fini') {
                        manutention = booking.manutention.facture;
                    }

                    const total = transport + fauxFrais + manutention;

                    return {
                        totalTransport: acc.totalTransport + transport,
                        totalManutention: acc.totalManutention + manutention,
                        totalGlobal: acc.totalGlobal + total
                    };
                }, { totalTransport: 0, totalManutention: 0, totalGlobal: 0 });

                setStats({
                    totalBookings: bookings.length,
                    totalClients: clients,
                    totalFactures: factures,
                    ...totals
                });

            } catch (error) {
                console.error('Erreur lors de la récupération des statistiques:', error);
            }
        };

        fetchStats();
    }, []);

    const calculationRules = [
        {
            title: 'Frais de Transport',
            description: 'Transport = Nombre de conteneurs (TC) × Frais de transport unitaire',
            details: [
                'Varie selon le type de conteneur (20 ou 40 pieds)',
                'Inclut les frais de transport maritime',
                'Calculé par conteneur'
            ]
        },
        {
            title: 'Faux Frais',
            description: 'Faux Frais = Nombre de conteneurs × Taux des faux frais',
            details: [
                'Frais administratifs',
                'Frais de documentation',
                'Frais divers par conteneur'
            ]
        },
        {
            title: 'Frais de Manutention',
            description: 'Varie selon le type de produit (Matière première ou Semi-fini)',
            details: [
                'Matière première: Facture + DFU + Honoraires + Caution',
                'Produit semi-fini: Uniquement la facture de base',
                'DFU = Document Forfaitaire Unique'
            ]
        }
    ];

    return (
        <div className="p-6">
            <Title level={2} className="mb-6">Tableau de Bord</Title>

            {/* Statistiques Principales */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Bookings"
                            value={stats.totalBookings}
                            prefix={<ContainerOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Clients"
                            value={stats.totalClients}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Factures"
                            value={stats.totalFactures}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Chiffre d'Affaires Global"
                            value={stats.totalGlobal}
                            suffix="FCFA"
                            precision={0}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: '#eb2f96' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Statistiques Détaillées des Bookings */}
            <Title level={3} className="mb-4">Détails Financiers des Bookings</Title>
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Total Transport"
                            value={stats.totalTransport}
                            suffix="FCFA"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Total Manutention"
                            value={stats.totalManutention}
                            suffix="FCFA"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Total Global Bookings"
                            value={stats.totalGlobal}
                            suffix="FCFA"
                            precision={0}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Règles de Calcul */}
            <Title level={3} className="mb-4">Règles de Calcul des Frais</Title>
            <Row gutter={[16, 16]}>
                {calculationRules.map((rule, index) => (
                    <Col xs={24} md={8} key={index}>
                        <Card title={rule.title} className="h-full">
                            <Paragraph>
                                <Text strong>{rule.description}</Text>
                            </Paragraph>
                            <List
                                size="small"
                                dataSource={rule.details}
                                renderItem={item => (
                                    <List.Item>
                                        <Text>{item}</Text>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}