export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const KEY_ACCESS_TOKEN = IS_PRODUCTION ? 'GSTID' : 'STG_GSTID';
export const KEY_REFRESH_TOKEN = IS_PRODUCTION ? 'R_GSTID' : 'R_STG_GSTID';
