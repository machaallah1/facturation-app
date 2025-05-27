'use client';

import { Button, Card, Form, Input, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const { Title } = Typography;

export default function LoginPage() {
    const router = useRouter();
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = async (values: any) => {
        const { email, password } = values;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            messageApi.success('Connexion réussie !');
            router.push('/dashboard');
        } catch (error: unknown) {
            console.error("Détails de l'erreur:", error);

            if (error instanceof Error) {
                messageApi.error(`Erreur: ${error.message}`);
            } else {
                messageApi.error("Une erreur inattendue est survenue.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
            {contextHolder}
            <Card className="w-full max-w-md shadow-md">
                <div className="text-center mb-6">
                    <Title level={2} className="!mb-2 !text-gray-800">Connexion</Title>
                    <p className="text-gray-600">Entrez vos identifiants pour accéder à votre compte</p>
                </div>

                <Form
                    name="login_form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Veuillez saisir votre email!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-300" />}
                            placeholder="Email"
                            size="large"
                            className="py-2"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Veuillez saisir votre mot de passe!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-300" />}
                            placeholder="Mot de passe"
                            size="large"
                            className="py-2"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            className="h-10 font-medium"
                        >
                            Se connecter
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-4">
                    <Link href="/register" className="text-blue-600 hover:text-blue-800 transition-colors">
                        Créer un nouveau compte
                    </Link>
                </div>
            </Card>
        </div>
    );
}