<template>
  <div id="app">
    <modal-help />
    <session v-if="config.modals.session.active" />
    <onboarding v-else-if="onboarding.active" />
    <template v-else>
      <app-header />
      <div id="app-content"><router-view /></div>
      <modal-receive />
    </template>
    <tm-notifications :notifications="notifications" theme="cosmos" />
    <modal-error
      v-if="config.modals.error.active"
      :body="config.modals.error.message"
    />
    <modal-node-halted v-if="config.modals.nodeHalted.active" />
    <modal-lcd-approval v-if="approvalRequired" :hash="approvalRequired" />
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import AppHeader from "common/AppHeader"
import TmNotifications from "common/TmNotifications"
import ModalError from "common/TmModalError"
import ModalHelp from "common/TmModalHelp"
import ModalLcdApproval from "common/TmModalLCDApproval"
import ModalNodeHalted from "common/TmModalNodeHalted"
import ModalReceive from "common/TmModalReceive"
import Onboarding from "common/TmOnboarding"
import Session from "common/TmSession"
import store from "./vuex/store"

/**
 * Main App component
 * @vue-prop {String} propname Just an example
 * @vue-prop {Number} [niceProp=1] - A very cool incoerent prop not required but with 1 as default
 * @vue-data {Object} nothing
 * @vue-computed {function} notifications mapGetter
 * @vue-computed {function} config mapGetter
 * @vue-computed {function} themes mapGetter
 * @vue-computed {function} approval mapGetter
 * @vue-computed {function} required mapGetter
 * @vue-computed {function} onboarding mapGetter
 */
export default {
  name: `app`,
  components: {
    AppHeader,
    ModalError,
    ModalHelp,
    ModalLcdApproval,
    ModalReceive,
    TmNotifications,
    ModalNodeHalted,
    Onboarding,
    Session
  },
  computed: {
    ...mapGetters([
      `notifications`,
      `config`,
      `themes`,
      `approvalRequired`,
      `onboarding`
    ])
  },
  mounted() {
    this.$store.commit(`loadOnboarding`)
    this.$store.commit(`setTheme`, `dark`)
  },
  store
}
</script>

<style>
@import "./styles/app.css";
</style>
