## Introduction

In this document we will see how to create and configure a [CMS][CMS] using [Strapi][Strapi] and how to create a [Static Website][ssg-ssr-csr] (in this case I will use [Astro][Astro], the framework is irrelevant, the key is that the generated content will be static), consuming the content loaded in our CMS.

Being a static website, all the content displayed will be generated when we build our website. Therefore, if we change or upload new content in our CMS, we must rebuild our website for it to display the updated content.

We would not need to do this if our website were served from the server, since when entering a URL, the server would generate the content associated with that URL at that moment and return it to the client. Something similar happens if it were rendered from the client, since it would call our API from the client and render the content at that moment.

But we want our website to be static, since this gives it great navigation speed and content loading, practically instantaneous.

To solve the problem of manually building our website after each content update in our CMS, we will create a small server in our [VPS][VPS], the same VPS where we will deploy the CMS and the Web. This server will listen to a [Webhook][Webhook-Strapi] sent by our CMS after each content update, with which we will automatically run a new build of our Web.

And the updated content will be reflected on our website.

### Requirements

- Hire a VPS (4-10 usd)
- Register a domain (2-8 usd)

### Steps

1. [Hire a VPS](#hire-vps)
2. [Register Domain and create subdomains](#register-domain)
3. [Create Strapi project](#create-strapi)
4. [Create Web project](#create-web)
5. [Configure VPS](#configure-vps)
6. [Deploy CMS on the VPS](#deploy-cms)
7. [Deploy the Web on the VPS](#deploy-web)
8. [Create Webhook Trigger](#create-webhook-cms)
9. [Create Webhook Endpoint](#create-webhook-endpoint)
10. [Deploy Endpoint on the VPS](#deploy-endpoint)

<a id="hire-vps"></a>

### 1. Hire a VPS

- We hire a VPS to deploy our projects.
- In this case I will use [DigitalOcean][DigitalOcean] to hire a [Droplet][Droplet] (VPS), but you can hire it on your platform of choice.
- We create a Project within our DigitalOcean Panel.
- Within this Project, we create a Droplet:
  - Region: where our VPS will be located.
  - OS: Ubuntu latest LTS.
  - Type: Basic Initial, it will be enough for this example but you choose the one you prefer.
  - Authentication Method: by [SSH][SSH] Key -> we add our public SSH key. (You can create your SSH key by following the steps indicated in the Upload Form)
  - We can give our Droplet a custom name in Hostname.
  - We create our Droplet.
  - We copy the IPv4 of our VPS.

<a id="register-domain"></a>

### 2. Register Domain and create subdomains

- We register a domain for our website.

  - In this case I will use [Namecheap][Namecheap] to register my domain, I will use as an example: my-personal-blog.com
  - We search for and register the desired domain, and enter our account to configure the domain.
  - In this step I am going to explain 2 possible ways to configure the [DNS][DNS] records:

    - The first is to configure the DNS records of our domain directly from the platform where we registered it.
    - The second is to delegate the DNS to DigitalOcean and configure our domain within DigitalOcean, which will have some benefits. You can manage your DNS records with the control panel and the API. The domains you manage in DigitalOcean integrate with DigitalOcean load balancers and spaces to optimize automatic SSL certificate management.

    1. Configure DNS in our Domain Registrar's platform:

    - We go to the administration/configuration section of our domain.
    - We go to the advanced DNS configuration section and create:
      1.  Main domain, for our website -> Type: Record A | Host: @ | Value: IPv4 of our VPS | TTL: Automatic
      2.  Subdomain for our CMS, I will use "back" -> Type: Record A | Host: back | Value: IPv4 of our VPS | TTL: Automatic
      3.  Subdomain for our mini server, I will use "hook" -> Type: Record A | Host: hook | Value: IPv4 of our VPS | TTL: Automatic
      4.  We add "www" to our domain -> Type: CNAME | Host: www | Value: @ | TTL: Automatic

    2. Delegate DNS to DigitalOcean:

    - On the platform where we acquired our domain, we go to the administration/configuration section of our domain
    - In the NAMESERVERS configuration, we select Custom DNS and add the following Nameservers:
      1.  ns1.digitalocean.com
      2.  ns2.digitalocean.com
      3.  ns3.digitalocean.com
    - Now we go to our Project in DigitalOcean
    - Within our Project, we will see a Create button, click and we will see a list, we select Domains/DNS
    - In this "Networking" section, we must be in the Domains section
    - We add the domain we have registered to our project
    - Now we can configure the DNS records
      1.  Main domain, where our website will be located -> Record Type A - Hostname: @ | IP: our Droplet | TTL: 3600
      2.  Subdomain where our CMS will be located, I will use "back" -> Record Type A - Hostname: back | IP: our Droplet | TTL: 3600
      3.  Subdomain where our mini server will be located, I will use "hook" -> Record Type A - Hostname: hook | IP: our Droplet | TTL: 3600
      4.  We add "www" to our domain -> Record Type CNAME | Hostname: www | Alias of: @ | TTL: 43200

<a id="create-strapi"></a>

### 3. Create Strapi project

- We will create our Strapi project on our local machine
  ```
    npx create-strapi-app@latest
  ```
- Database to use: the one of your choice, I will use Sqlite
- We install dependencies and run the project in development mode
  ```
    npm install
    npm run dev
  ```
- We will create the necessary Content Types
- We will load test content
- Configure API Token to be able to use the API from our local client
- Run the project build locally and check that everything works ok
  ```
    npm run build
    npm run start
  ```
- We will upload our Strapi project to a new remote repository (Github, Gitlab, etc.)
  ```
    git add .
    git commit -m "init project"
    git push origin main
  ```

<a id="create-web"></a>

### 4. Create Web project

- We will create our web project with our framework to use
  ```
    npm create astro@latest
  ```
- Configure our website in static mode
- We use the API provided by our Strapi CMS to load the content
- We run the build and start the website locally to check that everything is displayed ok
  ```
    npm run build
    npm run start
  ```
- We will upload our web project to a new remote repository (Github, Gitlab, etc.)
  ```
    git add .
    git commit -m "init project"
    git push origin main
  ```

<a id="configure-vps"></a>

### 5. Configure VPS

- We enter our VPS via SSH
  ```
    ssh root@{{IPv4}}
  ```
- We update packages
  ```
    sudo apt update && sudo apt upgrade -y
  ```
- We install [NVM][NVM] and the Node version necessary to run Strapi
  ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
  ```
  ```
    nvm install {{NODE_VERSION}}
  ```
- We install [PM2][PM2]
  ```
    npm install -g pnpm@latest pm2@latest
  ```
- We install [Nginx][Nginx] and configure the Firewall
  ```
    sudo apt install nginx -y
    sudo systemctl status nginx
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    sudo ufw reload
    sudo ufw status
  ```
- We install [Certbot][Certbot] to create HTTPS certificates with [Let's Encrypt][LetsEncrypt]
  ```
    sudo apt install certbot python3-certbot-nginx -y
  ```
- We create the directory where we will clone our projects
  ```
    mkdir /var/www/project
  ```

<a id="deploy-cms"></a>

### 6. Deploy CMS on the VPS

- We clone the CMS repository and install the packages
  ```
    cd /var/www/project
    git clone {{url_repository}} cms-strapi
    cd cms-strapi
    npm install
  ```
- We configure the necessary environment variables
  ```
    cp .env.example .env
    nano .env
  ```
- We run the CMS build
  ```
    npm run build
  ```
- We start a PM2 instance to run Strapi
  ```
    cd /var/www/proyect/cms-strapi
    pm2 start npm --name "cms-strapi" -- run start
    pm2 save
  ```
- We create a Vhost for the CMS

  ```
    sudo rm /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    sudo nano /etc/nginx/sites-available/cms-strapi.conf
  ```

  <!--
    Replace "back.my-personal-blog.com" with your complete subdomain
    Replace "1337" with the port assigned to your Strapi project
  -->

  ```nginx
    # cms-strapi.conf
    server {
        listen 80;
        server_name back.my-personal-blog.com;

        location / {
            proxy_pass http://localhost:1337;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
  ```

  ```
    sudo ln -s /etc/nginx/sites-available/cms-strapi.conf /etc/nginx/sites-enabled/
  ```

- We create an HTTPS certificate with Let's Encrypt for the CMS subdomain
  <!-- Replace "back.my-personal-blog.com" with your complete subdomain -->
  ```
    sudo certbot --nginx -d back.my-personal-blog.com
    sudo certbot renew --dry-run
  ```
- Restart Nginx
  ```
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
  ```
- We check in the browser that the CMS works in the enabled subdomain.
- We obtain the Strapi API Token to use it on our website.

<a id="deploy-web"></a>

### 7. Deploy the Web on the VPS

- We clone the Web repository and install the packages
  ```
    cd /var/www/project
    git clone {{url_repository}} web-blog
    cd web-blog
    npm install
  ```
- We configure the necessary environment variables
  ```
    cp .env.example .env
    nano .env
  ```
- We run the Web build
  ```
    npm run build
  ```
- We create a Vhost for the Web

  ```
    sudo nano /etc/nginx/sites-available/web-blog.conf
  ```

  <!--
    Replace "my-personal-blog.com" with your domain
    Replace "/var/www/project/web-blog/dist" with the directory where your site is generated
  -->

  ```nginx
    # web-blog.conf
    server {
      listen 80;
      server_name my-personal-blog.com www.my-personal-blog.com;

      root /var/www/project/web-blog/dist;
      index index.html;

      location / {
        try_files $uri $uri/ /index.html;
      }

      error_page 404 /index.html;

      access_log /var/log/nginx/my-personal-blog.com_access.log;
      error_log /var/log/nginx/my-personal-blog.com_error.log;
    }
  ```

  ```
    sudo ln -s /etc/nginx/sites-available/web-blog.conf /etc/nginx/sites-enabled/
  ```

- We create an HTTPS certificate with Let's Encrypt for the Web domain
  <!-- Replace "my-personal-blog.com" with your domain -->
  ```
    sudo certbot --nginx -d my-personal-blog.com -d www.my-personal-blog.com
    sudo certbot renew --dry-run
  ```
- Restart Nginx
  ```
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
  ```
- We check in the browser that the Web works in the enabled domain.

<a id="create-webhook-cms"></a>

### 8. Create Webhook Trigger in the Strapi CMS

- In the browser we go to our subdomain and enter the CMS
- In the administration panel, we go to the "Settings" -> "Webhooks" section
- Create new Webhook
- Field configuration:
  1.  Name: for example "Rebuild Web Site"
  2.  Url: here we will use the subdomain created for the Webhook together with the endpoint to create -> https://hook.my-personal-blog.com/webhook/rebuild
  3.  Headers: Key -> x-webhook-secret, Value -> some-secret-key
  <!-- You can use a Header from the list or create a custom one, and the secret must be a token that will be used to validate the request on the server -->
  4.  Triggers: select the events that will trigger the webhook
  5.  Save the webhook

<a id="create-webhook-endpoint"></a>

### 9. Create mini-server to create an endpoint to receive the webhook

- We will create our [Express][Express] project on our local machine, you can use the framework of your choice
- We go to our PC
  ```
    mkdir server-webhook
    cd server-webhook
    npm init -y
    npm install express dotenv
  ```
- Update the package.json and add "type": "module"
- We create the server and configure the endpoint where we will listen to the webhook

  ```
    touch index.js
  ```

  ```js
  // index.js
  import express from "express";
  import { exec } from "child_process";
  import "dotenv/config";

  const { PORT, WEBHOOK_SECRET, PATH_PROYECT } = process.env;

  const app = express();

  app.use(express.json());

  app.post("/webhook/rebuild", (req, res) => {
    const secret = req.headers["x-webhook-secret"]; // Header used in the Webhook created in Strapi

    if (secret !== WEBHOOK_SECRET) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    res.status(200).json({ message: "Rebuilding" });

    exec(`cd ${PATH_PROYECT} && node --run build`, (err, stdout, stderr) => {
      if (err) console.error("❌ Error in rebuild:", stderr);
      else console.log("✅ Rebuild complete:", stdout);
    });
  });

  app.listen(PORT, () => {
    console.log(`🟢 Webhook listen in http://localhost:${PORT}`);
  });
  ```

- We create the necessary environment variables and the example file
  ```
    touch .env.example
  ```
  ```conf
    # Port to use
    PORT=4000
    # Same secret used in the Strapi Webhook configuration
    WEBHOOK_SECRET="some-secret-key"
    # Full path where our Web project is located
    PATH_PROYECT="/var/www/project/web-blog"
  ```
- We initialize a Git repository and create the Git Ignore
  ```
    git init
    touch .gitignore
  ```
  ```
    # .gitignore
    node_modules
    package-lock.json
    .env
  ```
- We will upload our mini-server to a new remote repository (Github, Gitlab, etc.)
  ```
    git add .
    git commit -m "init project"
    git push origin main
  ```

<a id="deploy-endpoint"></a>

### 10. Deploy mini-server on the VPS

- We enter the VPS via SSH
  ```
    ssh root@{{IPv4}}
  ```
- We go to the directory where our projects are located
  ```
    cd /var/www/project
  ```
- We clone the Mini Server repository and install the packages
  ```
    git clone {{url_repository}} server-webhook
    cd server-webhook
    npm install
  ```
- We configure the necessary environment variables
  ```
    cp .env.example .env
    nano .env
  ```
- We start a PM2 instance to run the Server
  ```
    pm2 start index.js --name server-webhook
    pm2 save
    pm2 startup
  ```
- We create a Vhost for the Server

  ```
    sudo nano /etc/nginx/sites-available/server-webhook.conf
  ```

  <!--
    Replace "hook.my-personal-blog.com" with your complete subdomain
    Replace "4000" with the port assigned to your Mini Server
  -->

  ```nginx
    # server-webhook.conf
    server {
        listen 80;
        server_name hook.my-personal-blog.com;

        location / {
            proxy_pass http://localhost:4000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
  ```

  ```
    sudo ln -s /etc/nginx/sites-available/server-webhook.conf /etc/nginx/sites-enabled/
  ```

- We create an HTTPS certificate with Let's Encrypt for the Server subdomain
  <!-- Replace "hook.my-personal-blog.com" with your complete subdomain -->
  ```
    sudo certbot --nginx -d hook.my-personal-blog.com
    sudo certbot renew --dry-run
  ```
- Restart Nginx
  ```
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
  ```
- We check in the browser by updating or loading new content in our CMS, then we will go to the Web to check that the content is updated.
- If everything has gone well, we have finished our configuration. With this, we will have our CMS and Web online, and the website will update automatically after each content update. Congratulations 👏

<kbd> <br> [GitHub CMS](https://github.com/sebbamarin/test-cms) <br> </kbd>
<kbd> <br> [GitHub BLOG](https://github.com/sebbamarin/test-blog) <br> </kbd>
<kbd> <br> [GitHub WEBHOOK](https://github.com/sebbamarin/test-webhook) <br> </kbd>

[CMS]: https://kinsta.com/knowledgebase/content-management-system/
[Strapi]: https://strapi.io/
[ssg-ssr-csr]: https://dev.to/teyim/a-deep-dive-into-csr-ssr-ssg-and-isr-3513
[Astro]: https://astro.build/
[Webhook-Strapi]: https://docs.strapi.io/cms/backend-customization/webhooks
[SSH]: https://www.cloudflare.com/learning/access-management/what-is-ssh/
[Namecheap]: https://www.namecheap.com/
[VPS]: https://cloud.google.com/learn/what-is-a-virtual-private-server
[Droplet]: https://www.digitalocean.com/products/droplets
[DNS]: https://www.cloudflare.com/learning/dns/what-is-dns/
[NVM]: https://github.com/nvm-sh/nvm
[PM2]: https://pm2.io/
[Nginx]: https://nginx.org/
[Certbot]: https://certbot.eff.org/
[LetsEncrypt]: https://letsencrypt.org/
[Express]: https://expressjs.com/
