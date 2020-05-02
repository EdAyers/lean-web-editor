Personal log of what I did to set up an aws instance that watches the git repo.


1. Log on to aws, [launch a new t2.micro instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/launching-instance.html) using aws-linux.
2. [Log on to the instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstances.html)
3. [set up docker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-basics.html):
    ```sh
    sudo yum update -y
    sudo amazon-linux-extras install docker
    sudo service docker start
    sudo usermod -a -G docker ec2-user
    ```
    Then log out and log back in.
4. Clone lean
   ```
   sudo yum install -y git
   git clone https://github.com/EdAyers/lean.git
   cd lean
   git checkout widget
   ```
5. Build the lean emscripten. An alternative is to pull the archive from the github action. But I thought it would be good to have it all done locally.
   ```

   mkdir -p build/emscripten
   cd build/release
   docker run -dit --name emscripten -v $(pwd):/src edayers/emscripten bash
   docker exec -it -w /src/build/emscripten emscripten emconfigure cmake /src/src -DCMAKE_BUILD_TYPE=Emscripten -DLEAN_EMSCRIPTEN_BUILD=Main
   docker exec -it -w /src/build/emscripten -e NODE_OPTIONS="--max-old-space-size=4096" emscripten emmake make
   ```
6. Build lean
   ```
   sudo yum groupinstall "Development Tools"
   sudo yum install gmp-devel
   mkdir -p build/release
   cd build/release
   cmake ../../src
   make
   ```
7. Install elan
   ```
   sudo amazon-linux-extras install python3
   curl https://raw.githubusercontent.com/Kha/elan/master/elan-init.sh -sSf | bash -s -- --default-toolchain none -y
   elan toolchain link local $(pwd)/lean
   ```
8. build the lean-web-editor
   ```
   git clone https://github.com/EdAyers/lean-web-editor.git
   cd lean-web-editor
   elan override set local
   mkdir dist
   cp ~/lean/build/emscripten/shell/lean_js_* ./dist
   ./mk_library.py
   npm run build
   ```
9. __Give the instance a public IP address.__
   Go to the EC2 console.
   Go to 'elastic IPs'.
   Click allocate IP address.
   Use Amazon's pool of IPv4 addresses, hit the allocate button.
   Click on the newly made IP address and click 'associate', then associate it with the EC2 instance you made.
   Now your instance has a public IP address but you still need to open up the ports.
10. __Open the ports__. Go to 'security groups' tab,create a security group. Then add a load of 'inbound rules':
    <table>
        <tr><th>Type</th>  <th>Protocol</th> <th>Port range</th> <th>Source</th></tr>
        <tr><td>HTTP</td>  <td>TCP</td> <td>80</td>  <td>0.0.0.0/0</td></tr>
        <tr><td>HTTP</td>  <td>TCP</td> <td>80</td>  <td>::/0</td></tr>
        <tr><td>SSH</td>   <td>TCP</td> <td>22</td>  <td>0.0.0.0/0</td></tr>
        <tr><td>SSH</td>   <td>TCP</td> <td>22</td>  <td>::/0</td></tr>
        <tr><td>HTTPS</td> <td>TCP</td> <td>443</td> <td>0.0.0.0/0</td></tr>
        <tr><td>HTTPS</td> <td>TCP</td> <td>443</td> <td>::/0</td></tr>
    </table>
    Then you make it so that the EC2 instance is a member of this security group.
11. __Set up the domain name__. I went to my domain registrar and made an 'A record' pointing `demo.edayers.com` to the IP address made by the previous step.
12. [__set up apache webserver__](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-lamp-amazon-linux-2.html).
13. [Set up HTTPS and "let's encrypt"](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/SSL-on-amazon-linux-2.html)
   Install certbot with some convoluted installer magic.
    ``
   sudo wget -r --no-parent -A 'epel-release-*.rpm' http://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/
   sudo rpm -Uvh dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/epel-release-*.rpm
   sudo yum-config-manager --enable epel*
   sudo yum repolist all
   ```
   Replace `Listen 80` in `/etc/httpd/conf/httpd.conf` with
   ```
   <VirtualHost *:80>
    DocumentRoot "/var/www/html"
    ServerName "example.com"
    ServerAlias "www.example.com"
   </VirtualHost>
   ```
   ```
   sudo systemctl restart httpd
   sudo yum install -y certbot python2-certbot-apache
   sudo certbot
   ```
   Then follow the instructions.
   Finally add a cron job so that it automatically renews. Add this to `/etc/crontab`
   ```
   39      1,13    *       *       *       root    certbot renew --no-self-upgrade
   ```
   then run
   ```
   sudo systemctl restart crond
   ```
14. [ ] Symlink the `~/lean-web-editor/dist` folder to `/var/www`.
15. [ ] make a chron job that checks the github repos and rebuilds, redeploys everything.
