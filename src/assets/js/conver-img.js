// convert image url to Base64
export function convertImgToBase64(url, callback) {
    let canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'),
        img = new Image;
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL('image/jpeg');
        callback.call(this, dataURL);
        canvas = null;
    };
    img.src = url;
}