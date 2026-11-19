param(
    [string]$BaseUrl = 'http://127.0.0.1:9000',
    [string]$VisitDate = '04/11/2026',
    [string]$Email = 'admin.pruebas@hidratan.local',
    [string]$Password = 'HidratanDemo!2026'
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$seedHeaders = @{}

function Invoke-SeedApi {
    param([string]$Method, [string]$Path, $Body = $null, [hashtable]$Query = @{})
    $seedUri = $BaseUrl + $Path
    if ($Query.Count -gt 0) {
        $seedQuery = ($Query.GetEnumerator() | ForEach-Object {
            [uri]::EscapeDataString([string]$_.Key) + '=' + [uri]::EscapeDataString([string]$_.Value)
        }) -join '&'
        $seedUri += '?' + $seedQuery
    }
    $seedArguments = @{
        Uri = $seedUri
        Method = $Method
        Headers = $seedHeaders
        TimeoutSec = 30
        ContentType = 'application/json; charset=utf-8'
    }
    if ($null -ne $Body) {
        $seedArguments.Body = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 12 -Compress))
    }
    $seedResponse = Invoke-RestMethod @seedArguments
    if ($seedResponse -is [System.Array]) {
        foreach ($seedResponseItem in $seedResponse) { Write-Output $seedResponseItem }
    } else {
        Write-Output $seedResponse
    }
}

$seedAccountCreated = $false
try {
    $seedAuthentication = Invoke-SeedApi POST '/api/v1/auth/authenticate' @{email=$Email; password=$Password}
} catch {
    try {
        $seedAuthentication = Invoke-SeedApi POST '/api/v1/auth/register' @{
            email=$Email; password=$Password; name='Admin Pruebas'; role='ROLE_ADMIN'
        }
        $seedAccountCreated = $true
    } catch {
        throw 'No se pudo crear o autenticar la cuenta de prueba. No se modifico la contrasena de ninguna cuenta existente.'
    }
}

$seedAccessToken = $seedAuthentication.access_token
if (-not $seedAccessToken) { $seedAccessToken = $seedAuthentication.accessToken }
if (-not $seedAccessToken) { throw 'La API no devolvio un token de acceso.' }
$seedHeaders = @{Authorization='Bearer ' + $seedAccessToken}

$seedUsers = @(Invoke-SeedApi GET '/api/v1/management/users')
$seedAdmin = $seedUsers | Where-Object email -eq $Email | Select-Object -First 1
if (-not $seedAdmin -or $seedAdmin.role -ne 'ROLE_ADMIN' -or -not $seedAdmin.active) {
    throw 'La cuenta de prueba debe ser administradora y estar activa. No se alteraron cuentas existentes.'
}

$seedProductDefinitions = @(
    @{name='Bidon 20L [PRUEBA]'; price=3000; returnable=$true; target=30},
    @{name='Bidon 12L [PRUEBA]'; price=2000; returnable=$true; target=20},
    @{name='Pack agua [PRUEBA]'; price=1500; returnable=$false; target=15}
)
$seedProducts = @(Invoke-SeedApi GET '/products/list')
$seedSelectedProducts = @()
foreach ($seedDefinition in $seedProductDefinitions) {
    $seedProduct = $seedProducts | Where-Object name -eq $seedDefinition.name | Select-Object -First 1
    if (-not $seedProduct) {
        $seedProduct = Invoke-SeedApi POST '/products/save' -Query @{
            name=$seedDefinition.name
            price=$seedDefinition.price
            returnable=([string]$seedDefinition.returnable).ToLowerInvariant()
        }
    }
    if ([bool]$seedProduct.returnable -ne [bool]$seedDefinition.returnable) {
        throw ('El producto existente tiene un tipo incompatible: ' + $seedDefinition.name)
    }
    $seedStock = @(Invoke-SeedApi GET ('/api/v1/management/users/' + [uri]::EscapeDataString($Email) + '/stock'))
    $seedExistingStock = $seedStock | Where-Object { $_.product.id -eq $seedProduct.id } | Select-Object -First 1
    $seedCurrentQuantity = 0
    if ($seedExistingStock) { $seedCurrentQuantity = [int]$seedExistingStock.quantity }
    $seedMissingQuantity = [int]$seedDefinition.target - $seedCurrentQuantity
    if ($seedMissingQuantity -gt 0) {
        $null = Invoke-SeedApi POST '/api/v1/management/users/addStock' -Query @{
            productId=$seedProduct.id; quantity=$seedMissingQuantity; delivererEmail=$Email
        }
    }
    $seedSelectedProducts += $seedProduct
}

$seedClientDefinitions = @(
    @{address='PRUEBA - San Martin 100'; frecuency=7; debt=6000; stock20=5; stock12=3; time='10:00'; unique=$false;
        observations='PRUEBA: entregar 2 bidones de 20L, retirar 3 y registrar un pago de $3000. Verificar una sola entrada de historial y una proxima visita.'},
    @{address='PRUEBA - Belgrano 220'; frecuency=14; debt=3000; stock20=4; stock12=2; time='11:00'; unique=$false;
        observations='PRUEBA: entregar productos de ambos tamanos y retirar envases de ambos tipos en una misma visita.'},
    @{address='PRUEBA - Mitre 350'; frecuency=7; debt=0; stock20=3; stock12=3; time='12:00'; unique=$false;
        observations='PRUEBA: entregar 2 bidones de 20L y pagar $6000. Cargo y pago deben verse en la misma visita aunque el saldo final sea cero.'},
    @{address='PRUEBA - Sarmiento 480'; frecuency=10; debt=4500; stock20=5; stock12=2; time='13:00'; unique=$true;
        observations='PRUEBA VISITA UNICA: entregar y retirar productos; al finalizar no debe generarse otra visita.'}
)
$seedClients = @(Invoke-SeedApi GET '/delivery/clients')
$seedVisits = @(Invoke-SeedApi GET '/delivery/view')
$seedVisitSummary = @()
for ($seedClientIndex = 0; $seedClientIndex -lt $seedClientDefinitions.Count; $seedClientIndex++) {
    $seedClientDefinition = $seedClientDefinitions[$seedClientIndex]
    $seedClient = $seedClients | Where-Object address -eq $seedClientDefinition.address | Select-Object -First 1
    if (-not $seedClient) {
        $seedClient = Invoke-SeedApi POST '/delivery/clients' @{
            address=$seedClientDefinition.address
            frecuency=$seedClientDefinition.frecuency
            debt=$seedClientDefinition.debt
            phoneNumber=('110000000' + ($seedClientIndex + 1))
            zone='PRUEBAS'
            observations=$seedClientDefinition.observations
            clientStock=@()
        }
    }

    $seedClientStock = @(Invoke-SeedApi GET ('/api/v1/management/clients/' + $seedClient.id + '/stock'))
    for ($seedProductIndex = 0; $seedProductIndex -lt 2; $seedProductIndex++) {
        $seedProduct = $seedSelectedProducts[$seedProductIndex]
        $seedTarget = if ($seedProductIndex -eq 0) { [int]$seedClientDefinition.stock20 } else { [int]$seedClientDefinition.stock12 }
        $seedExistingStock = $seedClientStock | Where-Object { $_.product.id -eq $seedProduct.id } | Select-Object -First 1
        $seedCurrentQuantity = 0
        if ($seedExistingStock) { $seedCurrentQuantity = [int]$seedExistingStock.quantity }
        if ($seedCurrentQuantity -lt $seedTarget) {
            $null = Invoke-SeedApi POST ('/api/v1/management/clients/' + $seedClient.id + '/stock/add') -Query @{
                productId=$seedProduct.id; quantity=($seedTarget - $seedCurrentQuantity)
            }
        }
    }

    $seedDeliveryDate = $VisitDate + 'T' + $seedClientDefinition.time
    $seedVisit = $seedVisits | Where-Object {
        $_.client.id -eq $seedClient.id -and $_.delivererEmail -eq $Email -and $_.deliveryDate -eq $seedDeliveryDate
    } | Select-Object -First 1
    if (-not $seedVisit) {
        $seedVisitResult = Invoke-SeedApi POST '/delivery/create' -Query @{
            clientId=$seedClient.id
            assignedDeliverer=$Email
            deliveryDate=$seedDeliveryDate
            status='PENDING'
            uniqueVisit=([string]$seedClientDefinition.unique).ToLowerInvariant()
        }
        $seedVisitId = $seedVisitResult.id
        $seedVisitStatus = 'PENDING'
    } else {
        $seedVisitId = $seedVisit.deliverId
        $seedVisitStatus = $seedVisit.status
    }
    $seedVisitSummary += [pscustomobject]@{
        ClientId=$seedClient.id
        Address=$seedClient.address
        VisitId=$seedVisitId
        Date=$seedDeliveryDate
        Status=$seedVisitStatus
        UniqueVisit=$seedClientDefinition.unique
        Initial20L=$seedClientDefinition.stock20
        Initial12L=$seedClientDefinition.stock12
    }
}

$seedFinalStock = @(Invoke-SeedApi GET ('/api/v1/management/users/' + [uri]::EscapeDataString($Email) + '/stock'))
[pscustomobject]@{
    Email=$Email
    AccountCreated=$seedAccountCreated
    Role=$seedAdmin.role
    Products=@($seedFinalStock | ForEach-Object {
        [pscustomobject]@{Id=$_.product.id; Name=$_.product.name; Quantity=$_.quantity; Price=$_.product.price; Returnable=$_.product.returnable}
    })
    Visits=$seedVisitSummary
} | ConvertTo-Json -Depth 8
