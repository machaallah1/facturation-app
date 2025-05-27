import { LigneArticle } from "./article"
import { Client } from "./client"

export type Facture = {
    clientId: string
    articles: LigneArticle[]
    date: string
    total: number
}

export type FactureEnEdition = {
    id?: string
    clientId: string
    articles: LigneArticle[]
    date: string
    total: number
}

export type FactureAffichable = {
    id: string
    client: Client
    articles: Array<LigneArticle & { nom: string; prix: number; total: number }>
    date: string
    total: number
}