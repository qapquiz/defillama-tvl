# DefiLlama TVL

### Prerequisite
- `bun` 

### To install dependencies:

```bash
bun install
```

### To run:

```bash
bun run dev
```

This project involves updating the TVL for each DAO in the Governance Program IDs listed here.
We will cache the TVL for 30 days, after there will be a warning message to update the TVL.

#### Governance Program IDs
```
GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw
gUAedF544JeE6NYbQakQvribHykUNgaPJqcgf3UQVnY
GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J
DcG2PZTnj8s4Pnmp7xJswniCskckU5E6XsrKuyD7NYFK
AEauWRrpn9Cs6GXujzdp1YhMmv2288kBt3SdEcPYEerr
G41fmJzd29v7Qmdi8ZyTBBYa98ghh3cwHBTexqCG1PQJ
GovHgfDPyQ1GwazJTDY2avSVY8GGcpmCapmmCsymRaGe
pytGY6tWRgGinSCvRLnSv4fHfBTMoiDGiCsesmHWM6U
J9uWvULFL47gtCPvgR3oN7W357iehn5WF2Vn9MJvcSxz
JPGov2SBA6f7XSJF5R4Si5jEJekGiyrwP2m7gSEqLUs
Ghope52FuF6HU3AAhJuAAyS2fiqbVhkAotb7YprL5tdS
5sGZEdn32y8nHax7TxEyoHuPS3UXfPWtisgm8kqxat8H
smfjietFKFJ4Sbw1cqESBTpPhF4CwbMwN8kBEC1e5ui
GovMaiHfpVPw8BAM1mbdzgmSZYDw2tdP32J2fapoQoYs
GCockTxUjxuMdojHiABVZ5NKp6At8eTKDiizbPjiCo4m
HT19EcD68zn7NoCF79b2ucQF8XaMdowyPt5ccS6g1PUx
GRNPT8MPw3LYY6RdjsgKeFji5kMiG1fSxnxDjDBu4s73
ALLGnZikNaJQeN4KCAbDjZRSzvSefUdeTpk18yfizZvT
A7kmu2kUcnQwAVn8B4znQmGJeUrsJ1WEhYVMtmiBLkEr
MGovW65tDhMMcpEmsegpsdgvzb6zUwGsNjhXFxRAnjd
jdaoDN37BrVRvxuXSeyR7xE5Z9CAoQApexGrQJbnj6V
GMnke6kxYvqoAXgbFGnu84QzvNHoqqTnijWSXYYTFQbB
hgovkRU6Ghe1Qoyb54HdSLdqN7VtxaifBzRmh9jtd3S
jtogvBNH3WBSWDYD5FJfQP2ZxNTuf82zL8GkEhPeaJx
dgov7NC8iaumWw3k8TkmLDybvZBCmd1qwxgLAGAsWxf
```

We have 2 API for this.
1. GET /tvl - Displays the cached TVL (a warning will be shown if the data is older than 30 days)
2. POST /tvl - Updates the TVL for each DAO in the Governance Program IDs listed above. It will save the result in `tvl.json`
