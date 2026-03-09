import { IPost, SEOType } from "@/shared/types";

export type CategoryData = {
    category: {
        seo: SEOType
        link: string
    };
    posts: {
        edges: Array<{
            node: IPost
        }>
        pageInfo: {
            offsetPagination: {
                total: number
                hasMore: boolean
                hasPrevious: boolean
            }
        }
    }
}

export const GET_NEWS_ARCHIVE_DATA = ""