export const dateTime = {
  convertUTCToLocalTime(utcDateString: Date): Date {
    const utcDate = new Date(utcDateString);
    const timezoneOffsetInMillis = utcDate.getTimezoneOffset() * 60000;
    return new Date(utcDate.getTime() - timezoneOffsetInMillis);
  },
};
