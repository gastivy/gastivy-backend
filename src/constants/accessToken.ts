export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const KEY_ACCESS_TOKEN = IS_PRODUCTION ? 'GSTID' : 'STGGSTID';
export const KEY_REFRESH_TOKEN = IS_PRODUCTION ? 'RGSTID' : 'RSTGGSTID';
