<template>
  <tr class="data-table__row li-proposal">
    <td class="data-table__row__info">
      <div class="data-table__row__info__container">
        <span
          v-tooltip.top="status.message"
          v-if="proposal.proposal_status === `Passed`"
          :class="status.color"
          class="data-table__row__info__container__status material-icons"
          >checkmark</span
        ><span
          v-tooltip.top="status.message"
          v-else
          :class="status.color"
          class="data-table__row__info__container__status"
        />
        <router-link
          :to="{
            name: 'Proposal',
            params: { proposalId: proposal.proposal_id }
          }"
          class="data-table__row__info__container__name"
          >{{ proposal.title }}</router-link
        >
        <p class="data-table__row__info__container__description">
          {{ description }}
        </p>
      </div>
    </td>
    <td>{{ `#` + proposal.proposal_id }}</td>
    <td class="li-proposal__value yes">{{ tally.yes }}</td>
    <td class="li-proposal__value no">{{ tally.no }}</td>
    <td class="li-proposal__value no_with_veto">{{ tally.no_with_veto }}</td>
    <td class="li-proposal__value abstain">{{ tally.abstain }}</td>
  </tr>
</template>

<script>
import { mapGetters } from "vuex"
export default {
  name: `li-proposal`,
  props: {
    proposal: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters([`proposals`]),
    tally() {
      let proposalTally
      proposalTally = this.proposals.tallies[this.proposal.proposal_id] || {}
      proposalTally.yes = Math.round(parseFloat(proposalTally.yes))
      proposalTally.no = Math.round(parseFloat(proposalTally.no))
      proposalTally.no_with_veto = Math.round(
        parseFloat(proposalTally.no_with_veto)
      )
      proposalTally.abstain = Math.round(parseFloat(proposalTally.abstain))
      return proposalTally
    },
    status() {
      if (this.proposal.proposal_status === `Passed`) {
        return {
          message: `This proposal has passed`
        }
      } else if (this.proposal.proposal_status === `Rejected`) {
        return {
          message: `This proposal has been rejected and voting is closed`,
          color: `red`
        }
      } else if (this.proposal.proposal_status === `DepositPeriod`) {
        return {
          message: `Deposits are open for this proposal`,
          color: `yellow`
        }
      } else if (this.proposal.proposal_status === `VotingPeriod`) {
        return {
          message: `Voting for this proposal is open`,
          color: `green`
        }
      } else {
        return {
          message: `There was an error determining the status of this proposal.`,
          color: `grey`
        }
      }
    },
    description() {
      return this.proposal.description.length > 100
        ? this.proposal.description.substring(0, 100) + `…`
        : this.proposal.description.substring(0, 100)
    }
  }
}
</script>

<style>
.li-proposal__value.no_with_veto {
  min-width: 8rem;
}
.data-table__row__info__container__status.material-icons {
  width: 1rem;
  height: 1rem;
  overflow: hidden;
  top: 4px;
  left: -4px;
  color: var(--success);
  background: none;
}
</style>
