export const dateTime = {
  convertUTCToLocalTime(utcDateString: Date): Date {
    const utcDate = new Date(utcDateString);
    const timezoneOffsetInMillis = utcDate.getTimezoneOffset() * 60000;
    return new Date(utcDate.getTime() - timezoneOffsetInMillis);
  },

  getRangeInSeconds(startDate: Date, endDate: Date) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return Math.floor((end - start) / 1000);
  },

  calculateSecondsByCategory(
    data: { category_id: string; seconds: number }[],
  ): Record<string, number> {
    return data.reduce(
      (acc, item) => {
        const { category_id, seconds } = item;

        if (!acc[category_id]) {
          acc[category_id] = 0;
        }

        acc[category_id] += seconds;
        return acc;
      },
      {} as Record<string, number>,
    );
  },
};
