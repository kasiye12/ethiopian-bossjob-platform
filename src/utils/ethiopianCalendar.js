/**
 * Ethiopian Calendar Utilities
 * Handles conversion between Gregorian and Ethiopian calendars
 */

class EthiopianCalendar {
    constructor() {
        // Ethiopian month names
        this.months = [
            'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
            'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
        ];
        
        this.monthsShort = [
            'Mes', 'Tik', 'Hid', 'Tah', 'Tir', 'Yek',
            'Meg', 'Miy', 'Gin', 'Sen', 'Ham', 'Neh', 'Pag'
        ];
        
        this.daysOfWeek = [
            'Segno', 'Maksegno', 'Rebu', 'Hamus', 'Arb', 'Kidame', 'Ehud'
        ];
    }

    /**
     * Convert Gregorian date to Ethiopian date
     * @param {Date} gregorianDate - JavaScript Date object
     * @returns {Object} Ethiopian date object
     */
    gregorianToEthiopian(gregorianDate) {
        const date = new Date(gregorianDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Julian Day Number calculation
        const jdn = this.gregorianToJDN(year, month, day);
        return this.jdnToEthiopian(jdn);
    }

    /**
     * Convert Ethiopian date to Gregorian date
     * @param {Object} ethiopianDate - {year, month, day}
     * @returns {Date} JavaScript Date object
     */
    ethiopianToGregorian(ethiopianDate) {
        const jdn = this.ethiopianToJDN(
            ethiopianDate.year, 
            ethiopianDate.month, 
            ethiopianDate.day
        );
        return this.jdnToGregorian(jdn);
    }

    gregorianToJDN(year, month, day) {
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        
        let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
                  Math.floor(y / 4) - Math.floor(y / 100) + 
                  Math.floor(y / 400) - 32045;
        
        return jdn;
    }

    jdnToEthiopian(jdn) {
        const ethiopianEpoch = 1723856; // JDN of Ethiopian calendar epoch
        const year = Math.floor((jdn - ethiopianEpoch) / 365.25);
        let remainingDays = jdn - (ethiopianEpoch + Math.floor(year * 365.25));
        
        let month, day;
        
        if (remainingDays < 1) {
            remainingDays = jdn - (ethiopianEpoch + Math.floor((year - 1) * 365.25));
            month = 1;
            day = remainingDays + 1;
        } else {
            month = Math.floor(remainingDays / 30) + 1;
            day = remainingDays % 30;
            if (day === 0) {
                month -= 1;
                day = 30;
            }
        }
        
        return {
            year: year,
            month: month,
            day: day,
            monthName: this.months[month - 1],
            monthNameShort: this.monthsShort[month - 1]
        };
    }

    ethiopianToJDN(year, month, day) {
        const ethiopianEpoch = 1723856;
        return ethiopianEpoch + Math.floor(year * 365.25) + 
               (month - 1) * 30 + day - 1;
    }

    jdnToGregorian(jdn) {
        const a = jdn + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor((146097 * b) / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor((1461 * d) / 4);
        const m = Math.floor((5 * e + 2) / 153);
        
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        
        return new Date(year, month - 1, day);
    }

    /**
     * Format Ethiopian date as string
     * @param {Object} ethiopianDate
     * @param {String} format - 'full', 'short', 'medium'
     */
    formatEthiopianDate(ethiopianDate, format = 'full') {
        switch (format) {
            case 'full':
                return `${ethiopianDate.day} ${ethiopianDate.monthName} ${ethiopianDate.year}`;
            case 'short':
                return `${ethiopianDate.day}/${ethiopianDate.month}/${ethiopianDate.year}`;
            case 'medium':
                return `${ethiopianDate.day} ${ethiopianDate.monthNameShort} ${ethiopianDate.year}`;
            default:
                return `${ethiopianDate.day}/${ethiopianDate.month}/${ethiopianDate.year}`;
        }
    }

    /**
     * Get current Ethiopian date
     */
    getCurrentEthiopianDate() {
        return this.gregorianToEthiopian(new Date());
    }

    /**
     * Parse Ethiopian date string to object
     * @param {String} dateString - Format: DD/MM/YYYY
     */
    parseEthiopianDate(dateString) {
        const [day, month, year] = dateString.split('/').map(Number);
        return { year, month, day };
    }
}

module.exports = new EthiopianCalendar();
