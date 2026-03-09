// SEOType was previously imported from ../graphql (now deleted).
// Inline definition matching the legacy WP/Yoast SEO shape.
export type SEOType = {
    title?: string;
    metaDesc?: string;
    canonical?: string;
    opengraphTitle?: string;
    opengraphDescription?: string;
    opengraphImage?: {
        sourceUrl?: string;
    };
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: {
        sourceUrl?: string;
    };
    breadcrumbs?: Array<{ text: string; url: string }>;
    fullHead?: string;
    schema?: { raw?: string };
};

export type IPost = {
    id: string
    databaseId: number
    link: string
    title: string
    excerpt: string
    featuredImage?: {
        node: {
            sourceUrl: string
            altText: string
        }
    }
    categories: {
        edges: Array<{
            node: {
                link: string
                name: string
                id: string
            }
            isPrimary: boolean
        }>
    }
    seo: SEOType
    date: string
    content: string
    postMeta: {
        proUserOnly: boolean
        views: number
    }
    rating: {
        rate: number
        count: number
        voted?: boolean
    }
    hasAccess: boolean
}