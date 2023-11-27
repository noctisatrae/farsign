export interface SignerAuthStatus {
    signedKeyRequest: SignedKeyRequest
  }
  
  export interface SignedKeyRequest {
    token: string
    deeplinkUrl: string
    key: string
    requestFid: number
    state: string
    signerUser: SignerUser
  }
  
  export interface SignerUser {
    fid: number
    username: string
    displayName: string
    pfp: Pfp
    profile: Profile
    followerCount: number
    followingCount: number
    activeOnFcNetwork: boolean
    viewerContext: ViewerContext
  }
  
  export interface Pfp {
    url: string
    verified: boolean
  }
  
  export interface Profile {
    bio: Bio
    location: Location
  }
  
  export interface Bio {
    text: string
    mentions: any[]
  }
  
  export interface Location {
    placeId: string
    description: string
  }
  
  export interface ViewerContext {
    following: boolean
    followedBy: boolean
  }  