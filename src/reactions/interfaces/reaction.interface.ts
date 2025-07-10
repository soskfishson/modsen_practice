export enum ReactionType {
    LIKE = 'LIKE',
    DISLIKE = 'DISLIKE',
}

export interface IReaction {
    id: number;
    type: ReactionType;
    parentId: string;
    userId: string;
}
