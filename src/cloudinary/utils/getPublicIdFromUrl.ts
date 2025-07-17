export const getPublicIdFromUrl = (url: string): string => {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const publicIdWithExtension = lastPart;
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
};
