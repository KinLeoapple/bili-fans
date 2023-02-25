const net = require('net');

export const scanPort = async function (port, portAvailableCallback) {
    function portUsed(port) {
        return new Promise((resolve) => {
            let server = net.createServer().listen(port);
            server.on('listening', function () {
                server.close();
                resolve(port);
            });
            server.on('error', function (err) {
                if (err.code == 'EADDRINUSE') {
                    resolve(err);
                }
            });
        });
    }

    let res = await portUsed(port);
    if (res instanceof Error) {
        // console.log(`端口：${port}被占用\n`);
        port++;
        scanPort(port, portAvailableCallback);
    } else {
        portAvailableCallback(port);
    }
}