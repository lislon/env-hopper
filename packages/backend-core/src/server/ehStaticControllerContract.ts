export interface EhStaticControllerContract {
  methods: { 
    getIcon: { method: string; url: string }
    getScreenshot: { method: string; url: string }
  }
}

export const staticControllerContract: EhStaticControllerContract = {
  methods: {
    getIcon: {
      method: 'get',
      url: 'icon/:icon',
    },
    getScreenshot: {
      method: 'get',
      url: 'screenshot/:id',
    },
  },
}
