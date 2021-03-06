import Delegation from "renderer/vuex/modules/delegation"
import DelegationModal from "staking/DelegationModal"
import UndelegationModal from "staking/UndelegationModal"
import TmModal from "common/TmModal"
import setup from "../../../helpers/vuex-setup"
import PageValidator from "renderer/components/staking/PageValidator"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

const { stakingParameters } = lcdClientMock.state

const validator = Object.assign({}, lcdClientMock.state.candidates[0], {
  commission: {
    rate: `0.05`,
    max_rate: `0.1`,
    max_change_rate: `0.005`,
    update_time: `1970-01-01T00:00:00Z`
  },
  prev_bonded_shares: `0`,
  voting_power: `10`,
  selfBond: 0.01
})
const validatorTo = lcdClientMock.state.candidates[1]

const getterValues = {
  config: { desktop: false },
  delegates: {
    delegates: [validator, validatorTo],
    globalPower: 4200
  },
  delegation: {
    committedDelegates: { [lcdClientMock.validators[0]]: 0 },
    unbondingDelegations: {}
  },
  committedDelegations: {
    [lcdClientMock.validators[0]]: 0
  },
  keybase: `keybase`,
  oldBondedAtoms: 50,
  totalAtoms: 100,
  user: { atoms: 42 },
  wallet: { address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9` },
  connected: true,
  lastPage: null,
  stakingParameters,
  bondDenom: stakingParameters.parameters.bond_denom
}

describe(`PageValidator`, () => {
  let wrapper, store
  let { mount } = setup()

  beforeEach(() => {
    let instance = mount(PageValidator, {
      doBefore: ({ store }) => {
        store.commit(`setCommittedDelegation`, {
          candidateId: lcdClientMock.validators[0],
          value: `123.45678`
        })
        store.commit(`setConnected`, true)
        store.commit(`setDelegates`, [validator, validatorTo])
      },
      mocks: {
        $route: {
          params: { validator: validator.operator_address }
        }
      },
      getters: { bondDenom: () => stakingParameters.parameters.bond_denom }
    })
    wrapper = instance.wrapper
    store = instance.store
  })

  it(`has the expected html structure`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should return one delegate based on route params`, () => {
    expect(wrapper.vm.validator.operator_address).toEqual(
      lcdClientMock.validators[0]
    )
  })

  it(`shows a default avatar`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows an error if the validator couldn't be found`, () => {
    let instance = mount(PageValidator, {
      getters: {
        config: () => ({ desktop: false }),
        delegates: () => ({
          delegates: []
        }),
        bondDenom: () => stakingParameters.parameters.bond_denom
      },
      mocks: {
        $route: {
          params: { validator: validator.operator_address }
        }
      }
    })

    wrapper = instance.wrapper
    store = instance.store
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows the selfBond`, async () => {
    await store.commit(`setSelfBond`, {
      validator: {
        operator_address: lcdClientMock.validators[0],
        delegator_shares: `4242`
      },
      ratio: 0.01
    })
    expect(wrapper.find(`#page-profile__self-bond`).text()).toBe(`1.00 %`)
  })

  it(`should show the validator status`, () => {
    expect(wrapper.vm.status).toBe(`This validator is actively validating`)
    // Jailed
    store.state.delegates.delegates = [
      Object.assign({}, validator, {
        revoked: true
      })
    ]
    expect(wrapper.vm.status).toBe(
      `This validator has been jailed and is not currently validating`
    )
    // Is not a validator
    store.state.delegates.delegates = [
      Object.assign({}, validator, {
        voting_power: 0
      })
    ]
    expect(wrapper.vm.status).toBe(
      `This validator does not have enough voting power yet and is inactive`
    )
  })

  // TODO enable when we decide on limits are defined
  // it("switches color indicators", async () => {
  //   store.state.delegates.delegates = [
  //     Object.assign({}, delegate, {
  //       commission: "0"
  //     })
  //   ]
  //   expect(wrapper.find("#validator-profile__commission").classes()).toContain(
  //     "green"
  //   )
  //
  //   store.state.delegates.delegates = [
  //     Object.assign({}, delegate, {
  //       commission: "0.02"
  //     })
  //   ]
  //   expect(wrapper.find("#validator-profile__commission").classes()).toContain(
  //     "yellow"
  //   )
  //
  //   store.state.delegates.delegates = [
  //     Object.assign({}, delegate, {
  //       commission: "1"
  //     })
  //   ]
  //   expect(wrapper.find("#validator-profile__commission").classes()).toContain(
  //     "red"
  //   )
  //
  //   store.state.delegates.globalPower = 1000
  //   store.state.delegates.delegates = [
  //     Object.assign({}, delegate, {
  //       tokens: "1000"
  //     })
  //   ]
  //   expect(wrapper.find("#validator-profile__power").classes()).toContain("red")
  //
  //   store.state.delegates.delegates = [
  //     Object.assign({}, delegate, {
  //       tokens: "10"
  //     })
  //   ]
  //   expect(wrapper.find("#validator-profile__power").classes()).toContain(
  //     "yellow"
  //   )
  //
  //   store.state.delegates.delegates = [
  //     Object.assign({}, delegate, {
  //       tokens: "1"
  //     })
  //   ]
  //   expect(wrapper.find("#validator-profile__power").classes()).toContain(
  //     "green"
  //   )
  // })

  it(`shows a validator as candidate if he has no voting_power`, () => {
    store.state.delegates.delegates = [
      Object.assign({}, validator, {
        voting_power: `0`
      })
    ]
    expect(wrapper.vm.status).toMatchSnapshot()
    // expect(wrapper.find(".page-profile__status").classes()).toContain(
    //   "yellow"
    // )
  })

  it(`shows that a validator is revoked`, () => {
    store.state.delegates.delegates = [
      Object.assign({}, validator, {
        revoked: true
      })
    ]
    expect(wrapper.vm.status).toMatchSnapshot()
    // expect(wrapper.find(".validator-profile__status").classes()).toContain(
    //   "red"
    // )
  })

  it(`disables delegation and undelegation buttons if not connected`, () => {
    expect(
      wrapper.vm.$el.querySelector(`#delegation-btn`).getAttribute(`disabled`)
    ).toBeNull()
    expect(
      wrapper.vm.$el.querySelector(`#undelegation-btn`).getAttribute(`disabled`)
    ).toBeNull()
    store.state.connection.connected = false
    expect(
      wrapper.vm.$el.querySelector(`#delegation-btn`).getAttribute(`disabled`)
    ).not.toBeNull()
    expect(
      wrapper.vm.$el.querySelector(`#undelegation-btn`).getAttribute(`disabled`)
    ).not.toBeNull()
  })
})

describe(`delegationTargetOptions`, () => {
  it(`always shows wallet in the first position`, () => {
    let $store = {
      commit: jest.fn(),
      dispatch: jest.fn()
    }

    let options = PageValidator.methods.delegationTargetOptions.call({
      ...getterValues,
      committedDelegations: {},
      $store,
      $route: {
        params: { validator: validator.operator_address }
      }
    })
    expect(options).toHaveLength(1)
    expect(options[0].address).toEqual(getterValues.wallet.address)

    expect(options).toMatchSnapshot()
  })

  it(`hides displayed validator if bonded`, () => {
    let $store = {
      commit: jest.fn(),
      dispatch: jest.fn()
    }

    let options = PageValidator.methods.delegationTargetOptions.call({
      ...getterValues,
      committedDelegations: {
        [lcdClientMock.validators[0]]: 10
      },
      delegation: {
        committedDelegates: {
          [lcdClientMock.validators[0]]: 10
        },
        unbondingDelegations: {}
      },
      $store,
      $route: {
        params: { validator: validator.operator_address }
      }
    })
    expect(options).toHaveLength(1)
    expect(options).not.toContainEqual(
      expect.objectContaining({ address: validator.operator_address })
    )
    expect(options[0].address).toEqual(getterValues.wallet.address)

    expect(options).toMatchSnapshot()
  })

  it(`shows bonded validators for redelegation options`, () => {
    let $store = {
      commit: jest.fn(),
      dispatch: jest.fn()
    }

    let options = PageValidator.methods.delegationTargetOptions.call({
      ...getterValues,
      committedDelegations: {
        [lcdClientMock.validators[0]]: 10,
        cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctplpn3au: 5
      },
      delegation: {
        committedDelegates: {
          [lcdClientMock.validators[0]]: 10,
          cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctplpn3au: 5
        },
        unbondingDelegations: {}
      },
      $store,
      $route: {
        params: { validator: validator.operator_address }
      }
    })

    expect(options).toHaveLength(2)
    expect(options).not.toContainEqual(
      expect.objectContaining({ address: validator.operator_address })
    )
    expect(options[0].address).toEqual(getterValues.wallet.address)
    expect(options).toContainEqual(
      expect.objectContaining({ address: validatorTo.operator_address })
    )

    expect(options).toMatchSnapshot()
  })
})

describe(`onDelegation`, () => {
  let wrapper, store

  beforeEach(() => {
    let { mount } = setup()

    let instance = mount(PageValidator, {
      doBefore: ({ store }) => {
        store.commit(`setCommittedDelegation`, {
          candidateId: lcdClientMock.validators[0],
          value: 100
        })
        store.commit(`setAtoms`, 1337)
        store.commit(`setConnected`, true)
        store.commit(`setDelegates`, [validator, validatorTo])
        store.state.wallet.address = lcdClientMock.addresses[0]
      },
      mocks: {
        $route: {
          params: { validator: validator.operator_address }
        }
      },
      getters: { bondDenom: () => stakingParameters.parameters.bond_denom }
    })
    wrapper = instance.wrapper
    store = instance.store
  })

  describe(`make sure we have enough atoms to delegate`, () => {
    it(`is enough`, () => {
      wrapper.find(`#delegation-btn`).trigger(`click`)
      expect(wrapper.contains(DelegationModal)).toEqual(true)
    })

    it(`is not enough`, () => {
      store.commit(`setAtoms`, 0)

      wrapper.find(`#delegation-btn`).trigger(`click`)
      expect(wrapper.vm.showCannotModal).toBe(true)
      expect(wrapper.contains(TmModal)).toEqual(true)
      expect(wrapper.text()).toContain(`delegate.`) // ...no atoms to delegate.
      expect(wrapper.vm.$el).toMatchSnapshot()

      wrapper.find(`#no-atoms-modal__btn`).trigger(`click`)
      expect(wrapper.vm.showCannotModal).toBe(false)
      expect(wrapper.contains(TmModal)).toEqual(false)
      expect(wrapper.text()).not.toContain(`delegate.`) // ...no atoms to delegate.
      expect(wrapper.vm.$el).toMatchSnapshot()
    })
  })

  describe(`submitDelegation`, () => {
    describe(`delegation`, () => {
      describe(`unit`, () => {
        it(`success`, async () => {
          let $store = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: { bondDenom: stakingParameters.parameters.bond_denom }
          }
          const address = `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`

          await PageValidator.methods.submitDelegation.call(
            {
              ...getterValues,
              validator,
              $store
            },
            {
              amount: 10,
              from: address,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toEqual([
            [
              `submitDelegation`,
              {
                password: `12345`,
                validator_addr: validator.operator_address,
                amount: 10
              }
            ]
          ])
          expect($store.commit.mock.calls).toEqual([
            [
              `notify`,
              {
                body: `You have successfully delegated your ${
                  stakingParameters.parameters.bond_denom
                }s`,
                title: `Successful delegation!`
              }
            ]
          ])
        })

        it(`error`, async () => {
          let $store = {
            commit: jest.fn(),
            dispatch: jest.fn(() => {
              throw new Error(`message`)
            }),
            getters: { bondDenom: stakingParameters.parameters.bond_denom }
          }
          const address = `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`

          await PageValidator.methods.submitDelegation.call(
            {
              ...getterValues,
              validator,
              $store
            },
            {
              amount: 10000000,
              from: address,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toEqual([
            [
              `submitDelegation`,
              {
                password: `12345`,
                validator_addr: validator.operator_address,
                amount: 10000000
              }
            ]
          ])

          expect($store.commit.mock.calls).toEqual([
            [
              `notifyError`,
              {
                body: `message`,
                title: `Error while delegating ${
                  stakingParameters.parameters.bond_denom
                }s`
              }
            ]
          ])
        })
      })

      describe(`composition`, () => {
        it(`delegation.submitDelegation`, async () => {
          const delegation = Delegation({})
          const address = `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
          const dispatch = jest.fn((type, payload) => {
            if (type === `submitDelegation`) {
              delegation.actions[type]($store, payload)
            }
          })

          const $store = {
            commit: jest.fn(),
            dispatch,
            rootState: getterValues,
            state: {
              committedDelegates: { [lcdClientMock.validators[0]]: 0 },
              unbondingDelegations: {},
              getters: { bondDenom: stakingParameters.parameters.bond_denom }
            }
          }

          await PageValidator.methods.submitDelegation.call(
            {
              ...getterValues,
              validator,
              $store
            },
            {
              amount: 10,
              from: address,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toMatchSnapshot()
          expect($store.commit.mock.calls).toMatchSnapshot()
        })
      })
    })

    describe(`redelegation`, () => {
      describe(`unit`, () => {
        it(`success`, async () => {
          let $store = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: { bondDenom: stakingParameters.parameters.bond_denom }
          }

          await PageValidator.methods.submitDelegation.call(
            {
              ...getterValues,
              validator: validatorTo,
              $store
            },
            {
              amount: 5,
              from: validator.operator_address,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toEqual([
            [
              `submitRedelegation`,
              {
                password: `12345`,
                validatorSrc: validator,
                validatorDst: validatorTo,
                amount: 5
              }
            ]
          ])

          expect($store.commit.mock.calls).toEqual([
            [
              `notify`,
              {
                title: `Successful redelegation!`,
                body: `You have successfully redelegated your ${
                  stakingParameters.parameters.bond_denom
                }s`
              }
            ]
          ])
        })

        it(`error`, async () => {
          let $store = {
            commit: jest.fn(),
            dispatch: jest.fn(() => {
              throw new Error(`message`)
            }),
            getters: { bondDenom: stakingParameters.parameters.bond_denom }
          }

          await PageValidator.methods.submitDelegation.call(
            {
              ...getterValues,
              validator: validatorTo,
              $store,
              $route: {
                params: { validator: validatorTo.operator_address }
              }
            },
            {
              password: `12345`,
              amount: 5,
              from: validator.operator_address,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toEqual([
            [
              `submitRedelegation`,
              {
                password: `12345`,
                validatorSrc: validator,
                validatorDst: validatorTo,
                amount: 5
              }
            ]
          ])

          expect($store.commit.mock.calls).toEqual([
            [
              `notifyError`,
              {
                title: `Error while redelegating ${
                  stakingParameters.parameters.bond_denom
                }s`,
                body: `message`
              }
            ]
          ])
        })
      })

      describe(`composition`, () => {
        it(`redelegation.submitDelegation`, async () => {
          const delegation = Delegation({})

          const dispatch = jest.fn((type, payload) => {
            if (type === `submitDelegation`) {
              delegation.actions[type]($store, payload)
            }
          })

          const $store = {
            commit: jest.fn(),
            dispatch,
            getters: getterValues,
            rootState: getterValues,
            state: {
              committedDelegates: { [lcdClientMock.validators[0]]: 10 },
              unbondingDelegations: {},
              getters: { bondDenom: stakingParameters.parameters.bond_denom }
            }
          }

          await PageValidator.methods.submitDelegation.call(
            {
              ...getterValues,
              validator: validatorTo,
              $store
            },
            {
              password: `12345`,
              amount: 5,
              from: validator.operator_address,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toMatchSnapshot()
          expect($store.commit.mock.calls).toMatchSnapshot()
        })
      })
    })
  })

  describe(`onUnstake`, () => {
    describe(`make sure there are enough atoms to unstake`, () => {
      it(`is enough`, () => {
        store.commit(`setCommittedDelegation`, {
          candidateId: lcdClientMock.validators[0],
          value: 10
        })

        wrapper.find(`#undelegation-btn`).trigger(`click`)
        expect(wrapper.vm.myBond.isGreaterThan(0)).toBe(true)
        expect(wrapper.vm.showUndelegationModal).toBe(true)
        expect(wrapper.contains(UndelegationModal)).toEqual(true)
      })

      it(`is not enough`, () => {
        store.commit(`setCommittedDelegation`, {
          candidateId: lcdClientMock.validators[0],
          value: 0
        })

        wrapper.find(`#undelegation-btn`).trigger(`click`)
        expect(wrapper.vm.showCannotModal).toBe(true)
        expect(wrapper.text()).toContain(`delegated to`)
        expect(wrapper.vm.$el).toMatchSnapshot()

        wrapper.find(`#no-atoms-modal__btn`).trigger(`click`)

        expect(wrapper.text()).not.toContain(`delegated to`)
        expect(wrapper.vm.$el).toMatchSnapshot()
      })
    })

    describe(`submitUndelegation`, () => {
      describe(`unit`, () => {
        it(`success`, async () => {
          let $store = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: { bondDenom: stakingParameters.parameters.bond_denom }
          }

          await PageValidator.methods.submitUndelegation.call(
            {
              ...getterValues,
              validator,
              $store
            },
            {
              amount: 10,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toEqual([
            [
              `submitUnbondingDelegation`,
              {
                password: `12345`,
                amount: -10,
                validator
              }
            ]
          ])

          expect($store.commit.mock.calls).toEqual([
            [
              `notify`,
              {
                body: `You have successfully undelegated 10 ${
                  stakingParameters.parameters.bond_denom
                }s.`,
                title: `Successful undelegation!`
              }
            ]
          ])
        })

        it(`error`, async () => {
          let $store = {
            commit: jest.fn(),
            dispatch: jest.fn(() => {
              throw new Error(`message`)
            }),
            getters: { bondDenom: stakingParameters.parameters.bond_denom }
          }

          await PageValidator.methods.submitUndelegation.call(
            {
              ...getterValues,
              validator,
              $store
            },
            {
              amount: 10,
              password: `12345`
            }
          )

          expect($store.dispatch.mock.calls).toEqual([
            [
              `submitUnbondingDelegation`,
              {
                password: `12345`,
                amount: -10,
                validator
              }
            ]
          ])

          expect($store.commit.mock.calls).toEqual([
            [
              `notifyError`,
              {
                body: `message`,
                title: `Error while undelegating ${
                  stakingParameters.parameters.bond_denom
                }s`
              }
            ]
          ])
        })
      })

      describe(`composition`, () => {
        it(`submits a successful undelegation`, async () => {
          const delegation = Delegation({})

          const dispatch = jest.fn((type, payload) => {
            if (type === `submitDelegation`) {
              delegation.actions[type]($store, payload)
            }
          })

          const $store = {
            commit: jest.fn(),
            dispatch,
            getters: getterValues,
            rootState: getterValues,
            state: {
              committedDelegates: { [lcdClientMock.validators[0]]: 10 },
              unbondingDelegations: {},
              getters: { bondDenom: stakingParameters.parameters.bond_denom }
            }
          }

          await PageValidator.methods.submitUndelegation.call(
            {
              ...getterValues,
              validator,
              $store
            },
            {
              password: `12345`,
              amount: 10
            }
          )

          expect($store.dispatch.mock.calls).toMatchSnapshot()
          expect($store.commit.mock.calls).toMatchSnapshot()
        })
      })
    })
  })
})
