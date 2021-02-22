---
layout: page
title: Contact
permalink: /contact/
---

You can reach me by [email](mailto:daniel@danielcoats.nz) or by filling out the form below.

{% include contact-form.html %}

<script>
    const CONTACT_BASE_URL = {% if jekyll.environment == "development" %}"http://localhost:7071"{% else %}"https://contactform4891.azurewebsites.net"{% endif %};
</script>
<script src="{{ base.url | prepend: site.url }}/assets/contact.js"></script>
