export function timeAgo(date) {
    const now = new Date();
    date = new Date(date);

    const diffInSeconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (diffInSeconds < 60) {
        return 'Less than a minute ago';
    } else if (minutes === 1) {
        return '1 minute ago';
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours === 1) {
        return '1 hour ago';
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else if (days === 1) {
        return '1 day ago';
    } else if (days < 7) {
        return `${days} days ago`;
    } else if (weeks === 1) {
        return '1 week ago';
    } else if (weeks < 4) {
        return `${weeks} weeks ago`;
    } else if (months === 1) {
        return '1 month ago';
    } else if (months < 12) {
        return `${months} months ago`;
    } else if (years === 1) {
        return '1 year ago';
    } else {
        return `${years} years ago`;
    }
}

export function formatNumber(val, empty) {
    if (empty)
        return '';

    let foundDot = false;
    let integerPart = '';
    let decimalPart = '';
    let arr;
    if (typeof val === 'number') {
        arr = val.toString();
    } else {
        arr = val;
    }
    for (const c in arr) {
        if (arr[c] === '.') {
            foundDot = true;
        }
        else {
            if (!foundDot) {
                integerPart += arr[c];
            }
            else {
                decimalPart += arr[c];
            }
        }
    }
    let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let formattedValue = formattedInteger;
    if (decimalPart !== '')
        formattedValue += '.' + decimalPart;
    else {
        if (foundDot)
            formattedValue += '.'
    }
    return formattedValue;
};