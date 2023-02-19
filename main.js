const os = require('os');
const readline = require('readline');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getMyIps() {
    let interfaces = os.networkInterfaces();
    let ips = {};
    let family = 'IPv4';
    let i = 1;

    Object.keys(interfaces).forEach((interfaceName) => {

        interfaces[interfaceName].forEach((info) => {
            if (info.family === family) {
                ips[i] = { name: interfaceName, ip: info.address }
                i++
            }
        })

    });

    return ips;
}

function listIps(ips) {
    for (let item of Object.entries(ips)) {
        let num  = item[0],
            info = item[1];
        console.log(`${num}: ${info.ip} (${info.name})`)
    }
    console.log('')
}

async function execScript(script) {
    try {
        const { stdout, stderr } = await exec(`${script}`);
        return stderr ? `stderr: ${stderr}` : stdout;
    } catch (e) {
        console.log(e)
    }
}

function setIpForScan(ips) {
    return new Promise((resolve, reject) => {
        rl.question('> Choose ip: ', (num) => {
            let ip = ips[num].ip;
            if (!ip) {
                reject(new Error('ip err'))
            }

            resolve(ip);

            rl.close();
        });
    })
}

function defGateway(ip) {
    let gateway = ip.split('.');
    gateway.pop();
    gateway.push('1');

    return gateway.join('.');
}

function main() {
    console.log('');

    let ips = getMyIps();

    listIps(ips)

    setIpForScan(ips).then(ip => {
        console.log(`\nTarget is set (${ip})\n`);

        let gateway = defGateway(ip)

        console.log(`Searching hosts.. (${gateway})\n`);


        let ipsPattern = /\b(\d+\.){3}\d+\b/g;

        //execScript('ls').then(console.log)

        execScript(`nmap -sP ${gateway}/24`).then(stdout => {
            let liveIps = stdout.match(ipsPattern)

            console.log('Discovered ips:\n')
            liveIps.forEach(ip => console.log(ip))
        });

    }).catch(console.log);
}

main();

