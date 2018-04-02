/**
 * A rejection anywhere in the chain stays is caught and passed as resolved.
 * @param {Function} onResolveOrReject 
 */
Promise.prototype.finally = function (onResolveOrReject) {
    return this
        .catch(error => {
            // this will "catch" the error and pass it as a resolved Promise,
            // so it will be passed through 'onResolveOrReject'
            // and continue the Promise chain as 'not-rejected'
            return error;
        })
        .then(value => {
            onResolveOrReject(value);
            return value;
        });
};
/**
 * A rejection anywhere in the chain stays rejected permanently.
 * @param {Function} onResolveOrReject 
 */
Promise.prototype.always = function (onResolveOrReject) {
    return this
        .then(value => {
            onResolveOrReject(value);
            return value;
        }, error => {
            // this will "catch" the error, pass it through the 'onResolveOrReject'
            // and rethrow it, so the rejection stays permanent
            onResolveOrReject(error);
            throw error;
        });
};