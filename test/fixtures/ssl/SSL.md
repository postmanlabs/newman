# About these certificates/keys

These certs are merely used in unit tests. In case that a cert ever has to be regenerated, it can be achieved like this.
All Keys have the passphrase 'password'.

## Generate a CSR from a private key

`openssl req -new -key server.key -out server.csr`

## Sign the CSR with the CA

`openssl x509 -req -days 10000 -in server.csr -CA ca.crt -CAkey ca.key -out server.crt -set_serial 1 -outform pem -extfile v3.ext -sha256`

## Fixture-server certs (e.g. `echo`)

Some certs stand in for real external hosts so a local fixture server can present a certificate that TLS-validates
for them. These reuse `config.cnf` for the CSR (so the CN is unchanged) and are signed with a dedicated extfile
that sets `subjectAltName` to the impersonated hostnames, e.g. `echo-v3.ext`:

`openssl x509 -req -in echo.csr -CA ca.crt -CAkey ca.key -passin pass:password -out echo.crt -set_serial 3 -outform pem -extfile echo-v3.ext -days 9999 -sha256`

See `generate-certificates.sh` for the full, regeneratable script.
