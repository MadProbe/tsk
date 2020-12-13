// Adopted to ts by MadProbe#7435
// All credits goes to Vitim.us 
// @see {https://gist.github.com/victornpb/7736865}
/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
export function occurrences(string, subString, allowOverlapping) {
    string += "";
    subString += "";
    if (subString.length <= 0)
        return (string.length + 1);
    var n = 0, pos = 0, step = allowOverlapping ? 1 : subString.length;
    while ((pos = string.indexOf(subString, pos)) >= 0) {
        ++n;
        pos += step;
    }
    return n;
}
