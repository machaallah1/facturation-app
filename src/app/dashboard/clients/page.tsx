'use client'

import { useEffect, useState } from 'react'
import { db } from '@/app/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { Button, Form, Input, Modal, Table, Tag, message, App } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

type Client = {
    id?: string
    nom: string
    email: string
    telephone: string
    entreprise?: string
    adresse?: string
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [form] = Form.useForm<Client>()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [messageApi, contextHolder] = message.useMessage()
    const [modal, modalContextHolder] = Modal.useModal()

    const clientsRef = collection(db, 'clients')

    const fetchClients = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(clientsRef)
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[]
            setClients(data)
        } catch (error) {
            message.error('Erreur lors du chargement des clients')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingId) {
                await updateDoc(doc(db, 'clients', editingId), values)
                message.success('Client mis à jour avec succès')
            } else {
                await addDoc(clientsRef, values)
                message.success('Client ajouté avec succès')
            }

            form.resetFields()
            setEditingId(null)
            setIsModalVisible(false)
            fetchClients()
        } catch (error) {
            message.error('Erreur lors de la sauvegarde')
        }
    }

    const handleEdit = (client: Client) => {
        form.setFieldsValue(client)
        setEditingId(client.id || null)
        setIsModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer ce client ?',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            okButtonProps: { loading: deleteLoading },
            async onOk() {
                setDeleteLoading(true);
                try {
                    await deleteDoc(doc(db, 'clients', id))
                    messageApi.success('Client supprimé avec succès')
                    fetchClients()
                } catch (error) {
                    messageApi.error('Erreur lors de la suppression')
                    console.error(error)
                } finally {
                    setDeleteLoading(false)
                }
            }
        })
    }

    const columns: ColumnsType<Client> = [
        {
            title: 'Nom',
            dataIndex: 'nom',
            key: 'nom',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Téléphone',
            dataIndex: 'telephone',
            key: 'telephone',
        },
        {
            title: 'Entreprise',
            dataIndex: 'entreprise',
            key: 'entreprise',
            render: (text) => text || '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="flex gap-2">
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id!)}
                    />
                </div>
            ),
        },
    ]

    useEffect(() => {
        fetchClients()
    }, [])

    return (
        <App>
            <div className="p-6">
                {contextHolder}
                {modalContextHolder}
                
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Gestion des Clients</h1>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            form.resetFields()
                            setEditingId(null)
                            setIsModalVisible(true)
                        }}
                    >
                        Ajouter un client
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={clients}
                    rowKey="id"
                    loading={loading}
                    bordered
                />

                <Modal
                    title={editingId ? "Modifier le client" : "Ajouter un client"}
                    open={isModalVisible}
                    onOk={handleSubmit}
                    onCancel={() => setIsModalVisible(false)}
                    okText={editingId ? "Mettre à jour" : "Ajouter"}
                    cancelText="Annuler"
                    confirmLoading={loading}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="nom"
                            label="Nom complet"
                            rules={[{ required: true, message: 'Le nom est obligatoire' }]}
                        >
                            <Input placeholder="Nom du client" />
                        </Form.Item>

                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: "L'email est obligatoire" },
                                    { type: 'email', message: "Email non valide" }
                                ]}
                            >
                                <Input placeholder="email@exemple.com" />
                            </Form.Item>

                            <Form.Item
                                name="telephone"
                                label="Téléphone"
                            >
                                <Input placeholder="+33 6 12 34 56 78" />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="entreprise"
                            label="Entreprise"
                        >
                            <Input placeholder="Nom de l'entreprise" />
                        </Form.Item>

                        <Form.Item
                            name="adresse"
                            label="Adresse"
                        >
                            <Input.TextArea placeholder="Adresse complète" rows={3} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </App>
    )
}