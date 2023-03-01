export let Sort = function (arr, desc = false) {
    if (arr === undefined) {
        return arr
    }
    if (arr.length <= 1) {
        return arr;
    }
    arr.sort((a, b) => {
        if (desc) {
            return b - a
        } else {
            return a - b
        }
    })
};
