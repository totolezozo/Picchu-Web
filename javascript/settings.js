document.addEventListener('DOMContentLoaded', () => {
  // Placeholder for Account Settings
const AccountSettings = {
  template: `<div>Content for Account Settings will be added here.</div>`,
};

// Privacy Settings Component
const PrivacySettings = {
  template: `<div>Content for Privacy Settings will be added here.</div>`,
};

// Contact Us Component
const ContactUs = {
  template: `
    <div>
      <h3>Contact Us</h3>
      <form>
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" placeholder="Your Name" required />
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" placeholder="Your Email" required />
        <label for="message">Message:</label>
        <textarea id="settings-message" name="message" rows="4" placeholder="Your Message"></textarea>
        <button type="submit" class="btn">Send</button>
      </form>
    </div>`,
};

// Privacy Policy Component
const PrivacyPolicy = {
  data() {
    return { content: '' };
  },
  mounted() {
    fetch('../txt_ressource/privacy_policy.html')
      .then((response) => response.text())
      .then((html) => {
        this.content = html;
      });
  },
  template: `<div class="rich-text-container" v-html="content"></div>`,
};

// Terms of Use Component
const TermsOfUse = {
  data() {
    return { content: '' };
  },
  mounted() {
    fetch('../txt_ressource/terms_of_use.html')
      .then((response) => response.text())
      .then((html) => {
        this.content = html;
      });
  },
  template: `<div class="rich-text-container" v-html="content"></div>`,
};

// Vue Application
const app = Vue.createApp({
  data() {
    return {
      activeCategory: null,
      settingsCategories: [
        { title: 'Account Settings', component: AccountSettings },
        { title: 'Privacy Settings', component: PrivacySettings },
        { title: 'Contact Us', component: ContactUs },
        { title: 'Privacy Policy', component: PrivacyPolicy },
        { title: 'Terms of Use', component: TermsOfUse },
      ],
    };
  },
  methods: {
    toggleCategory(index) {
      this.activeCategory = this.activeCategory === index ? null : index;
    },
  },
});

app.mount('#app');

});
