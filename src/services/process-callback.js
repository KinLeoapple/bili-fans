export function callback(Process) {
    if (Process !== undefined) {
        Process.stdout.on('data', data => {
            console.log('stdout: ' + data);
        });

        Process.stderr.on('data', data => {
            console.log('stderr: ' + data);
        });

        Process.on('close', code => {
            console.log('Subprocess stops, exit code ' + code);
        });

        Process.on('unhandledRejection', error => {
            console.log('unhandledRejection', error.message);
        });
    }
}