import download from "download";

export async function checkUpdate() {
    return new Promise(resolve => {
        (async () => {
            let bytes = await download('https://raw.githubusercontent.com/KinLeoapple/bili-fans/master/package.json')
            let str = new Buffer.from(bytes).toString()
            let json = JSON.parse(str)
            resolve(json.version)
        })()
    })
}