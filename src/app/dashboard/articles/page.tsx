'use client'

import { useEffect, useState } from 'react'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button, Form, Input, InputNumber, Table, Tag, Modal, message } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

type Article = {
    id?: string
    nom: string
    description?: string
    prix: number
    unite?: string
}

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [form] = Form.useForm<Article>()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [loading, setLoading] = useState(false)

    const articlesRef = collection(db, 'articles')

    const fetchArticles = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(articlesRef)
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]
            setArticles(data)
        } catch (error) {
            message.error('Erreur lors du chargement des articles')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingId) {
                const docRef = doc(db, 'articles', editingId)
                await updateDoc(docRef, values)
                message.success('Article mis à jour avec succès')
            } else {
                await addDoc(articlesRef, values)
                message.success('Article ajouté avec succès')
            }

            form.resetFields()
            setEditingId(null)
            setIsModalVisible(false)
            fetchArticles()
        } catch (error) {
            message.error('Erreur lors de la sauvegarde')
        }
    }

    const handleEdit = (article: Article) => {
        form.setFieldsValue(article)
        setEditingId(article.id || null)
        setIsModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer cet article ?',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            onOk: async () => {
                try {
                    await deleteDoc(doc(db, 'articles', id))
                    message.success('Article supprimé avec succès')
                    fetchArticles()
                } catch (error) {
                    message.error('Erreur lors de la suppression')
                }
            }
        })
    }

    const columns: ColumnsType<Article> = [
        {
            title: 'Nom',
            dataIndex: 'nom',
            key: 'nom',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text || '-'
        },
        {
            title: 'Prix',
            dataIndex: 'prix',
            key: 'prix',
            render: (prix) => `${prix} €`
        },
        {
            title: 'Unité',
            dataIndex: 'unite',
            key: 'unite',
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
        fetchArticles()
    }, [])

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des Articles</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        form.resetFields()
                        setEditingId(null)
                        setIsModalVisible(true)
                    }}
                >
                    Ajouter un article
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={articles}
                rowKey="id"
                loading={loading}
                bordered
            />

            <Modal
                title={editingId ? "Modifier l'article" : "Ajouter un article"}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => setIsModalVisible(false)}
                okText={editingId ? "Mettre à jour" : "Ajouter"}
                cancelText="Annuler"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="nom"
                        label="Nom"
                        rules={[{ required: true, message: 'Le nom est obligatoire' }]}
                    >
                        <Input placeholder="Nom de l'article" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea placeholder="Description (facultative)" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="prix"
                            label="Prix"
                            rules={[{ required: true, message: 'Le prix est obligatoire' }]}
                        >
                            <InputNumber
                                min={0}
                                step={0.01}
                                placeholder="Prix"
                                className="w-full"
                                addonAfter="€"
                            />
                        </Form.Item>

                        <Form.Item
                            name="unite"
                            label="Unité"
                        >
                            <Input placeholder="Unité (facultative)" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}