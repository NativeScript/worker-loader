<template>
  <Page>
    <ActionBar>
      <Label text="Home"></Label>
    </ActionBar>

    <GridLayout>
      <Label class="info">
        <FormattedString>
          <Span class="fas" text.decode="&#xf135; " />
          <Span :text="message" />
        </FormattedString>
      </Label>
    </GridLayout>
  </Page>
</template>

<script>
import { WorkerService } from "../worker.service";
var workerService = new WorkerService();
var jsWorker = workerService.initJsWorker();
jsWorker.onmessage = m => console.log(m);
jsWorker.postMessage("Js worker loader executed!");

export default {
  computed: {
    message() {
      return "Blank {N}-Vue app";
    }
  }
};
</script>

<style scoped lang="scss">
@import "~@nativescript/theme/scss/variables/blue";

// Custom styles
.fas {
  @include colorize($color: accent);
}

.info {
  font-size: 22;
  horizontal-align: center;
  vertical-align: center;
}
</style>
