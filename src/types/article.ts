export type Article = {
    id: string
    nom: string
    prix: number
}

export type LigneArticle = {
    articleId: string
    quantite: number
    nom: string
    prix: number
}

export type LigneFacture = {
    article: Article
    quantite: number
}

export type LigneArticleDisplay = LigneArticle & {
    nom: string
    prix: number
    total: number
}
