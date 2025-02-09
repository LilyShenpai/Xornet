<template>
  <div
    class="shadowButton"
    :id="allowCopy ? 'shadowButton' : null"
    :class="{ colored, didCopy, iconOnly: !title, tiny }"
    @click="allowCopy ? copyText() : null"
  >
    <h1 v-if="title">{{ copyMessage || title }}</h1>
    <Icon v-if="!textonly" :icon="icon" />
  </div>
</template>

<script>
import Icon from "@/components/misc/Icon";
export default {
  name: "ShadowButton",
  props: {
    title: { type: String },
    icon: { type: String },
    textonly: { type: Boolean },
    colored: { type: Boolean },
    allowCopy: { type: Boolean },
    tiny: { type: Boolean }
  },
  components: {
    Icon
  },
  data() {
    return {
      didCopy: false,
      copyMessage: null
    };
  },
  methods: {
    copyText() {
      let toCopy = document.querySelector("#shadowButton");
      var temp = document.createElement("textarea");
      document.body.appendChild(temp);
      temp.value = toCopy.innerText.toLowerCase();
      temp.select();
      try {
        var successful = document.execCommand("copy");
        document.body.removeChild(temp);
        var msg = successful ? "successful" : "unsuccessful";
        this.didCopy = true;
        this.copyMessage = "UUID Copied!";
        setTimeout(() => {
          this.didCopy = false;
          this.copyMessage = null;
        }, 3000);
      } catch {
        console.log("Oops, unable to copy");
      }
    }
  }
};
</script>

<style>
.shadowButton {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  height: fit-content;
  user-select: none;
  cursor: pointer;
  justify-content: space-between;

  gap: 8px;
  flex-direction: row;
  border-radius: 200px;
  transition: all 100ms;
  background-color: var(--shadowButton-color);
}

.shadowButton:not(.tiny) {
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.1);
}

.shadowButton:not(.colored):not(.didCopy):hover {
  filter: invert(1);
}

.shadowButton:active {
  transform: translateY(2px);
}

.shadowButton.colored:hover {
  background-color: var(--theme-color);
}

.shadowButton.colored:hover h1 {
  color: white;
}

.shadowButton.colored:hover img {
  filter: invert(1);
}

.shadowButton.didCopy {
  background-color: rgb(51, 255, 0) !important;
}

.shadowButton h1 {
  font-family: Roboto Mono, monospace;
  font-style: normal;
  font-weight: 700;
  font-size: 12px;
  color: var(--black);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-align: center;
  text-transform: uppercase;
}

.shadowButton img {
  width: 20px;
  filter: invert(var(--filter));
}

.shadowButton.iconOnly {
  padding: 8px;
}

.shadowButton.tiny {
  padding: 2px;
}

.shadowButton.tiny img {
  width: 16px;
}
</style>
