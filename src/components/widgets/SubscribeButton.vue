<template>
<button
  class="button"
  @click="$emit('click')"
>
  <eye-icon
    class="icon is-small only-icon"
    v-if="subscribed"
  />
  <eye-off-icon
    class="icon is-small only-icon"
    v-else
  />
</button>
</template>

<script>
import {
  EyeIcon,
  EyeOffIcon
} from 'vue-feather-icons'

export default {
  name: 'subscribe-button',
  components: {
    EyeIcon,
    EyeOffIcon
  },
  props: {
    subscribed: {
      default: false,
      type: Boolean
    }
  },
  computed: {}
}
</script>

<style scoped>
.button .icon.is-small.only-icon {
  margin-right: 0;
}
</style>
