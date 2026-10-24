<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left :back-link="tt('Back')"></f7-nav-left>
            <f7-nav-title title="Server Connection"></f7-nav-title>
        </f7-navbar>

        <f7-list strong inset dividers class="margin-top">
            <f7-list-input
                type="url"
                inputmode="url"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                clear-button
                label="Primary address (e.g. your home network)"
                placeholder="http://192.168.1.20:5555"
                v-model:value.trim="primary"
            ></f7-list-input>
            <f7-list-input
                type="url"
                inputmode="url"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                clear-button
                label="Backup address (used when the primary is unreachable)"
                placeholder="https://money.example.com"
                v-model:value.trim="backup"
            ></f7-list-input>
        </f7-list>

        <f7-list strong inset dividers>
            <f7-list-item title="Currently connected to" :footer="activeUrl"></f7-list-item>
            <f7-list-button :class="{ 'disabled': saving }" @click="save">Save and reconnect</f7-list-button>
        </f7-list>

        <f7-block class="margin-top-half" v-if="errorMessage">
            <p class="text-color-red">{{ errorMessage }}</p>
        </f7-block>
    </f7-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import { showLoading, hideLoading } from '@/lib/ui/mobile.ts';

import { getNativeServerUrl, getNativeServerConfig, setNativeServerConfig, resolveNativeServerUrl } from '@/lib/native.ts';

const { tt } = useI18n();

const config = getNativeServerConfig();
const primary = ref<string>(config.primary);
const backup = ref<string>(config.backup);
const activeUrl = ref<string>(getNativeServerUrl());
const saving = ref<boolean>(false);
const errorMessage = ref<string>('');

function save(): void {
    if (!primary.value && !backup.value) {
        errorMessage.value = 'Please enter at least one server address';
        return;
    }

    errorMessage.value = '';
    saving.value = true;
    showLoading(() => saving.value);

    setNativeServerConfig({ primary: primary.value, backup: backup.value });

    resolveNativeServerUrl().then(url => {
        saving.value = false;
        hideLoading();

        if (url) {
            // reload through the entry page, so all requests use the newly selected address
            window.location.replace('index.html');
        } else {
            errorMessage.value = 'Cannot reach any of the server addresses';
        }
    });
}
</script>
