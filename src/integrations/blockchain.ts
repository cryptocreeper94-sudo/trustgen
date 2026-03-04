/* ====== TrustGen — Blockchain Integration Stubs ====== */
/* Typed interfaces and placeholder functions for future blockchain integration */

// ── Wallet Provider Interface ──
export interface WalletProvider {
    name: string
    icon: string
    connect: () => Promise<WalletConnection>
    disconnect: () => Promise<void>
    isInstalled: () => boolean
}

export interface WalletConnection {
    address: string
    chainId: number
    chainName: string
    balance?: string
}

// ── NFT Minting ──
export interface NFTMintParams {
    name: string
    description: string
    imageUrl: string       // thumbnail of 3D scene
    modelUrl: string       // GLB download URL
    attributes: { trait_type: string; value: string }[]
    royaltyPercent: number
    collection?: string
}

export interface NFTMintResult {
    tokenId: string
    transactionHash: string
    contractAddress: string
    explorerUrl: string
}

// ── Token Gating ──
export interface TokenGateConfig {
    contractAddress: string
    chainId: number
    minBalance: number
    tokenType: 'ERC721' | 'ERC1155' | 'ERC20'
}

// ── Stub Implementations ──
export async function connectWallet(_provider?: string): Promise<WalletConnection> {
    console.warn('[TrustGen Blockchain] connectWallet() is a stub — wire up your provider')
    throw new Error('Blockchain integration not yet configured. Contact admin.')
}

export async function disconnectWallet(): Promise<void> {
    console.warn('[TrustGen Blockchain] disconnectWallet() is a stub')
}

export async function mintAsNFT(_params: NFTMintParams): Promise<NFTMintResult> {
    console.warn('[TrustGen Blockchain] mintAsNFT() is a stub — wire up your minting contract')
    throw new Error('NFT minting not yet configured. Contact admin.')
}

export async function verifyTokenGate(_config: TokenGateConfig, _walletAddress: string): Promise<boolean> {
    console.warn('[TrustGen Blockchain] verifyTokenGate() is a stub')
    return false
}

// ── Supported Wallets (future) ──
export const SUPPORTED_WALLETS: WalletProvider[] = [
    {
        name: 'MetaMask',
        icon: '🦊',
        connect: () => connectWallet('metamask'),
        disconnect: disconnectWallet,
        isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
    },
    {
        name: 'WalletConnect',
        icon: '🔗',
        connect: () => connectWallet('walletconnect'),
        disconnect: disconnectWallet,
        isInstalled: () => true, // always available via QR
    },
]
