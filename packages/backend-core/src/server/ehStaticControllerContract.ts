export interface EhStaticControllerContract {
  methods: { getIcon: { method: string; url: string } }
}

export const staticControllerContract: EhStaticControllerContract = {
  methods: {
    getIcon: {
      method: 'get',
      url: 'icon/:icon',
    },
  },
}
