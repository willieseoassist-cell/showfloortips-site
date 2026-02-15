#!/usr/bin/env node
/**
 * ShowFloorTips Million-Email Pipeline
 *
 * Commands:
 *   node million-email-pipeline.js generate    - Build lead database from seeds
 *   node million-email-pipeline.js send [n]    - Send batch (default: daily limit)
 *   node million-email-pipeline.js followup    - Send follow-up emails
 *   node million-email-pipeline.js status      - Pipeline dashboard
 *   node million-email-pipeline.js hotleads    - Show top leads to close
 *   node million-email-pipeline.js daily       - Full daily cycle
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// === CONFIG ===
const CONFIG = {
  RESEND_API_KEY: 're_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ',
  FROM: 'ShowFloorTips <hello@showfloortips.com>',
  DAILY_LIMIT: 95, // Stay under 100/day free tier
  BATCH_DELAY_MS: 1200,
  FOLLOWUP_DAYS: [3, 7, 14],
  LEADS_FILE: path.join(__dirname, 'pipeline-leads.jsonl'),
  STATE_FILE: path.join(__dirname, 'pipeline-state.json'),
  SENT_LOG: path.join(__dirname, 'pipeline-sent.jsonl'),
};

// === INDUSTRY SEED DATA ===
// Format: "Company:domain" pairs per industry
const SEEDS = {
  'Exhibit Design': [
    'Freeman:freeman.com','GES Global:ges.com','Skyline Exhibits:skyline.com','Nimlok:nimlok.com',
    'Displayit:displayit.com','Abex Display:abex.com','Encore Global:encoreglobal.com',
    'Czarnowski:czarnowski.com','Derse:derse.com','Sparks:sparks.com','Pinnacle Exhibits:pinnacleexhibits.com',
    'Exhibit Concepts:exhibitconcepts.com','Access TCA:accesstca.com','Expocentric:expocentric.com.au',
    'Steelhead Productions:steelheadproductions.com','Taylor Made Exhibits:tmexhibits.com',
    'Exhibit Systems:exhibitsystems.com','Classic Exhibits:classicexhibits.com','Orbus Exhibit:orbus.com',
    'Exponents:exponents.com','Hamilton Exhibits:hamiltonexhibits.com','Explora Design:exploradesign.com',
    'Impact XM:impactxm.com','MC2:mc-2.com','Beursstand:beursstand.com','2020 Exhibits:2020exhibits.com',
    'Triumfo:triumfo.com','Lab Exhibits:labexhibits.com','Ninetynine:ninetynine.com',
    'Apple Rock:applerock.com','Brumark:brumark.com','EDE:edeexpo.com',
    'Exhibit Edge:exhibitedge.com','Marketplace Events:marketplaceevents.com',
    'Pacific Color Graphics:pacificcolor.com','Porter Group:portergroup.com',
    'Xibit Solutions:xibitsolutions.com','Color Reflections:colorreflections.com',
    'Exhibitus:exhibitus.com','Condit Exhibits:condit.com','Craftsmen Industries:craftsmenindustries.com',
    'Moss Inc:mossinc.com','EWI Worldwide:ewiworldwide.com','Expo Displays:expodisplays.com',
    'Nomadic Display:nomadicdisplay.com','Excalibur Exhibits:excaliburexhibits.com',
    'Pro Exhibits:proexhibits.com','nParallel:nparallel.com','Structure Exhibits:structureexhibits.com',
    'Hill Partners:hillandpartners.com','The Expo Group:theexpogroup.com',
    'Featherlite Exhibits:featherliteexhibits.com','Optima Graphics:optimagraphics.com','Kubik:kubik.com',
  ],
  'Event Technology': [
    'Cvent:cvent.com','Bizzabo:bizzabo.com','Eventbrite:eventbrite.com','Hopin:hopin.com',
    'Whova:whova.com','Hubilo:hubilo.com','RainFocus:rainfocus.com','Pathable:pathable.com',
    'Boomset:boomset.com','Socio Events:socio.events','Validar:validar.com','iCapture:icapture.com',
    'Lead Liaison:leadliaison.com','Certain:certain.com','Attendify:attendify.com','Grip:grip.events',
    'Brella:brella.io','SpotMe:spotme.com','Swoogo:swoogo.com','vFairs:vfairs.com',
    'Airmeet:airmeet.com','Zuddl:zuddl.com','Goldcast:goldcast.io','Welcome:experiencewelcome.com',
    'Splash:splashthat.com','Stova:stova.io','EventMobi:eventmobi.com','Aventri:aventri.com',
    'Accelevents:accelevents.com','BigMarker:bigmarker.com','PheedLoop:pheedloop.com',
    'Webex Events:socio.events','InEvent:inevent.com','6Connex:6connex.com','GTR:gtr.net',
    'Swapcard:swapcard.com','Bevy:bevy.com','Luma:lu.ma','Rally:rally.video','Run The World:runtheworld.today',
  ],
  'Convention Centers': [
    'McCormick Place:mccormickplace.com','Javits Center:javitscenter.com','OCCC:occc.net',
    'Georgia World Congress:gwcc.com','LVCC:vegasmeansbusiness.com','Anaheim CC:visitanaheim.org',
    'San Diego CC:visitsandiego.com','NRG Center:nrgpark.com','Dallas CC:visitdallas.com',
    'EventsDC:eventsdc.com','Boston CC:signatureboston.com','Kay Bailey Hutchison:dallasconventioncenter.com',
    'Music City Center:nashvillemusiccitycenter.com','Colorado CC:denverconvention.com',
    'Phoenix CC:phoenixconventioncenter.com','Austin CC:austinconventioncenter.com',
    'Pennsylvania CC:paconvention.com','Moscone Center:moscone.com','Huntington Place:huntingtonplacedetroit.com',
    'Raleigh CC:raleighconvention.com','Salt Palace:visitsaltlake.com','Henry Gonzalez CC:sahbgcc.com',
    'Minneapolis CC:minneapolisconventioncenter.com','Kansas City CC:kcconvention.com',
    'Charlotte CC:charlotteconventionctr.com','Tampa CC:tampabayconventioncenter.com',
    'Ernest Morial CC:mccno.com','Hawaii CC:meethawaii.com',
  ],
  'AV Production': [
    'WorldStage:worldstage.com','Bartha:bartha.com','Bluewater Tech:bluewatertech.com',
    'LMG:lmg.net','PRG:prg.com','PSAV:psav.com','Encore:encoreglobal.com',
    'Freeman AV:freeman.com','Hargrove:hargrove.com','CCS:ccsprojects.com',
    'Presentation Products:presentationproducts.com','Cramer:cramer.com','Metro Connections:metroconnections.com',
    'AVT:avteam.com','Meeting Tomorrow:meetingtomorrow.com','AV Chicago:avchicago.com',
    'Showcore:showcore.com','SmartSource:smartsourcerentals.com','AVI-SPL:avispl.com','Whitlock:whitlock.com',
  ],
  'Promotional Products': [
    'HALO:halo.com','4imprint:4imprint.com','Pinnacle Promotions:pinnaclepromotions.com',
    'ePromos:epromos.com','Quality Logo Products:qualitylogoproducts.com','AnyPromo:anypromo.com',
    'Kotis Design:kotisdesign.com','Brand Spirit:brandspirit.com','Amsterdam Printing:amsterdamprinting.com',
    'National Pen:nationalpen.com','Crestline:crestline.com','Staples Promo:staplespromotionalproducts.com',
    'Custom Ink:customink.com','Vistaprint:vistaprint.com','Zazzle:zazzle.com',
    'Printful:printful.com','Printify:printify.com','TotallyPromo:totallypromotional.com',
    'Swag.com:swag.com','BrandVia:brandvia.com',
  ],
  'Event Furniture': [
    'CORT Events:cortevents.com','AFR Events:afrevents.com','FormDecor:formdecor.com',
    'Taylor Creative:taylorcreativeinc.com','Blueprint Studios:blueprintstudios.com',
    'Signature Rentals:signatureeventrentals.com','EventAccents:eventaccents.com',
    'Classic Party Rentals:classicpartyrentals.com','Marquee Event Rentals:marqueerents.com',
    'Stuart Event Rentals:stuartrental.com','Town Country Event:townandcountryeventrentals.com',
    'Party Rental Ltd:partyrentalltd.com','Event Rents:eventrents.com','CE Rental:cerental.com',
  ],
  'Signage Graphics': [
    'FASTSIGNS:fastsigns.com','SpeedPro:speedpro.com','AlphaGraphics:alphagraphics.com',
    'Sir Speedy:sirspeedy.com','Minuteman Press:minutemanpress.com','Insomnia Design:insomniadesign.com',
    'Image Makers:imagemakers.com','Signs By Tomorrow:signsbytomorrow.com','Signs Now:signsnow.com',
    'The Sign Factory:thesignfactory.com','Signarama:signarama.com','Big Visual Group:bigvisualgroup.com',
  ],
  'Event Staffing': [
    'ATN Event Staffing:atneventstaffing.com','Attack Marketing:attackmarketing.com',
    'Hype Agency:hypeagency.com','National Event Staffing:nationaleventstaffing.com',
    'Convention Staffing:conventionstaffing.com','PromoWorks:promoworks.com',
    'Event Solutions:eventsolutions.com','Allied Global:alliedglobalmarketing.com',
    'Brand Connections:brandconnections.com','TalentBurst:talentburst.com',
  ],
  'Show Management': [
    'Informa Markets:informamarkets.com','RX Global:rxglobal.com','Messe Frankfurt:messefrankfurt.com',
    'Messe Munich:messe-muenchen.de','Messe Berlin:messe-berlin.de','Messe Dusseldorf:messe-duesseldorf.com',
    'Koelnmesse:koelnmesse.com','NurnbergMesse:nuernbergmesse.de','Emerald Expositions:emeraldx.com',
    'Clarion Events:clarionevents.com','Diversified Communications:divcom.com','Questex:questex.com',
    'Tarsus Group:tarsus.com','Urban Expositions:urban-expo.com','Comexposium:comexposium.com',
    'GL Events:gl-events.com','Fiera Milano:fieramilano.it','HKTDC:hktdc.com',
    'UBM:ubm.com','PennWell:pennwell.com','Hanley Wood:hanleywood.com',
    'National Events:nationalevents.com','Northstar Travel:northstartravelgroup.com',
    'Access Intelligence:accessintelligence.com','MJBiz:mjbizdaily.com',
  ],
  'Event Catering': [
    'Sodexo Live:sodexolive.com','Levy Restaurants:levyrestaurants.com','Centerplate:centerplate.com',
    'Aramark:aramark.com','Delaware North:delawarenorth.com','Compass Group:compass-group.com',
    'Elior Group:eliorgroup.com','Eurest:eurest.com','Chartwells:chartwells.com',
    'Wolfgang Puck Catering:wolfgangpuck.com','Patina Group:patinagroup.com',
  ],
  'Event Insurance': [
    'K&K Insurance:kandkinsurance.com','EventHelper:eventhelper.com','Thimble:thimble.com',
    'Hiscox:hiscox.com','Hartford:thehartford.com','Markel:markel.com',
    'Travelers:travelers.com','Zurich:zurich.com','AIG:aig.com',
  ],
  'Corporate Travel': [
    'BCD Travel:bcdtravel.com','CWT:mycwt.com','Amex GBT:amexglobalbusinesstravel.com',
    'CTM:travelctm.com','Direct Travel:directtravel.com','TripActions:tripactions.com',
    'Egencia:egencia.com','Flight Centre:flightcentre.com','World Travel:worldtravelinc.com',
    'Christopherson:christopherson.com','National Travel:ntrinc.com',
  ],
  'Associations': [
    'HCEA:hcea.org','PCMA:pcma.org','ILEA:ileahub.com','SITE:siteglobal.com',
    'Events Industry Council:eventscouncil.org','AMC Institute:amcinstitute.org','AIPC:aipc.org',
    'ICCA:iccaworld.org','MPI:mpi.org','CEIR:ceir.org','IAEE:iaee.com','EDPA:edpa.com',
    'TSEA:tsea.org','SISO:siso.org','UFI:ufi.org','ASAE:asae.org','RCMA:rcma.org',
  ],
  'Freight Logistics': [
    'GES Logistics:ges.com','Agility Logistics:agility.com','Fern Expo:fernexpo.com',
    'Brede Allied:bfrg.com','FedEx Custom:fedex.com','UPS Trade Show:ups.com',
    'DHL Events:dhl.com','XPO Logistics:xpo.com','DB Schenker:dbschenker.com',
    'Kuehne Nagel:kuehne-nagel.com','Expeditors:expeditors.com','CH Robinson:chrobinson.com',
    'JAS Forwarding:jas.com','Nippon Express:nipponexpress.com','Bolloré:bollore-logistics.com',
  ],
  'Flooring Services': [
    'Trade Show Flooring:tradeshowflooring.com','Snap Lock:snaplockflooring.com',
    'Edlen Electrical:edlen.com','Champion Exposition:championexposition.com',
    'Service Contractors:servicecontractor.com','Installation Svcs:installationservicesinc.com',
  ],
  'Marketing Agencies': [
    'Jack Morton:jackmorten.com','George P Johnson:gpj.com','Momentum:momentumww.com',
    'MAS Event:maseventdesign.com','Opus Agency:opusagency.com','Sparks:wearesparks.com',
    'Entire Productions:entireproductions.com','Pico Global:pico.com','Hartmann Studios:hartmannstudios.com',
    'Gradient Experience:gradientexperience.com','EventWorks:eventworks.com',
    'AgencyEA:agencyea.com','BCD Meetings:bcdme.com','Bishop McCann:bishopmccann.com',
    'HelmsBriscoe:helmsbriscoe.com','PRA Business Events:pra.com',
  ],
  'Technology': [
    'Microsoft:microsoft.com','Google:google.com','Amazon:amazon.com','Apple:apple.com',
    'Meta:meta.com','Salesforce:salesforce.com','Oracle:oracle.com','SAP:sap.com',
    'Adobe:adobe.com','IBM:ibm.com','Intel:intel.com','Cisco:cisco.com','Dell:dell.com',
    'HP:hp.com','Lenovo:lenovo.com','Samsung:samsung.com','Sony:sony.com','LG:lg.com',
    'Nvidia:nvidia.com','AMD:amd.com','Qualcomm:qualcomm.com','Broadcom:broadcom.com',
    'Texas Instruments:ti.com','Micron:micron.com','Western Digital:westerndigital.com',
    'Seagate:seagate.com','NetApp:netapp.com','Pure Storage:purestorage.com',
    'VMware:vmware.com','Citrix:citrix.com','ServiceNow:servicenow.com','Workday:workday.com',
    'Splunk:splunk.com','Palo Alto Networks:paloaltonetworks.com','CrowdStrike:crowdstrike.com',
    'Fortinet:fortinet.com','Check Point:checkpoint.com','Zscaler:zscaler.com',
    'Okta:okta.com','Twilio:twilio.com','Datadog:datadoghq.com','Snowflake:snowflake.com',
    'Databricks:databricks.com','HashiCorp:hashicorp.com','Elastic:elastic.co',
    'MongoDB:mongodb.com','Confluent:confluent.io','Cloudflare:cloudflare.com',
    'DigitalOcean:digitalocean.com','Akamai:akamai.com','Fastly:fastly.com',
    'Zoom:zoom.us','RingCentral:ringcentral.com','Vonage:vonage.com','Twilio:twilio.com',
    'HubSpot:hubspot.com','Zendesk:zendesk.com','Freshworks:freshworks.com',
    'Monday.com:monday.com','Asana:asana.com','Atlassian:atlassian.com','Notion:notion.so',
    'Canva:canva.com','Figma:figma.com','Miro:miro.com','Loom:loom.com',
    'DocuSign:docusign.com','Dropbox:dropbox.com','Box:box.com',
    'Autodesk:autodesk.com','PTC:ptc.com','Siemens Digital:siemens.com','Dassault:3ds.com',
    'ANSYS:ansys.com','Synopsys:synopsys.com','Cadence:cadence.com',
    'Keysight:keysight.com','National Instruments:ni.com','Rohde Schwarz:rohde-schwarz.com',
    'Zebra Technologies:zebra.com','Honeywell:honeywell.com','Emerson:emerson.com',
    'Rockwell Automation:rockwellautomation.com','ABB:abb.com','Schneider Electric:se.com',
    'Siemens:siemens.com','GE:ge.com','Johnson Controls:johnsoncontrols.com',
  ],
  'Healthcare': [
    'Medtronic:medtronic.com','Johnson & Johnson:jnj.com','Abbott:abbott.com',
    'Baxter:baxter.com','Boston Scientific:bostonscientific.com','Stryker:stryker.com',
    'Zimmer Biomet:zimmerbiomet.com','Smith & Nephew:smith-nephew.com','BD:bd.com',
    'Edwards Lifesciences:edwards.com','Intuitive Surgical:intuitive.com',
    'ResMed:resmed.com','Hologic:hologic.com','Teleflex:teleflex.com','Integra:integralife.com',
    'NuVasive:nuvasive.com','Globus Medical:globusmedical.com','Haemonetics:haemonetics.com',
    'ICU Medical:icumed.com','Merit Medical:merit.com','Penumbra:penumbrainc.com',
    'Masimo:masimo.com','Natus Medical:natus.com','Cantel Medical:cantelmedical.com',
    'Halyard Health:halyardhealth.com','Hill-Rom:hillrom.com','Getinge:getinge.com',
    'Draeger:draeger.com','Karl Storz:karlstorz.com','Olympus Medical:olympus-global.com',
    'Fujifilm Medical:fujifilm.com','GE Healthcare:gehealthcare.com','Philips Healthcare:philips.com',
    'Siemens Healthineers:siemens-healthineers.com','Canon Medical:medical.canon',
    'Carestream:carestream.com','Agfa Healthcare:agfa.com','McKesson:mckesson.com',
    'Cardinal Health:cardinalhealth.com','Henry Schein:henryschein.com','Patterson:pattersoncompanies.com',
    'Owens & Minor:owens-minor.com','Medline:medline.com','Concordance:concordance.com',
  ],
  'Manufacturing': [
    'Caterpillar:cat.com','Deere:deere.com','3M:3m.com','Parker Hannifin:parker.com',
    'Illinois Tool Works:itw.com','Eaton:eaton.com','Dover:dovercorporation.com',
    'Roper Technologies:ropertech.com','Fortive:fortive.com','Ametek:ametek.com',
    'Danaher:danaher.com','Xylem:xylem.com','Pentair:pentair.com','Graco:graco.com',
    'Nordson:nordson.com','Lincoln Electric:lincolnelectric.com','Kennametal:kennametal.com',
    'Sandvik:sandvik.com','Atlas Copco:atlascopco.com','Komatsu:komatsu.com',
    'Mitsubishi Heavy:mhi.com','Fanuc:fanuc.com','Yaskawa:yaskawa.com','KUKA:kuka.com',
    'Universal Robots:universal-robots.com','Omron:omron.com','Keyence:keyence.com',
    'Cognex:cognex.com','Renishaw:renishaw.com','Hexagon:hexagon.com',
    'Trumpf:trumpf.com','DMG Mori:dmgmori.com','Mazak:mazakusa.com','Haas:haascnc.com',
    'Okuma:okuma.com','Makino:makino.com','Doosan:doosanmachinetools.com',
    'Mitsubishi Electric:mitsubishielectric.com','Beckhoff:beckhoff.com','B&R:br-automation.com',
    'Phoenix Contact:phoenixcontact.com','Weidmuller:weidmuller.com','Harting:harting.com',
    'Murrelektronik:murrelektronik.com','Balluff:balluff.com','SICK:sick.com','Turck:turck.com',
    'ifm electronic:ifm.com','Endress Hauser:endress.com','Vega:vega.com',
  ],
  'Food & Beverage': [
    'Nestle:nestle.com','PepsiCo:pepsico.com','Coca-Cola:coca-cola.com','Unilever:unilever.com',
    'Mondelez:mondelezinternational.com','Mars:mars.com','Kelloggs:kelloggs.com',
    'General Mills:generalmills.com','Conagra:conagrabrands.com','Hormel:hormelfoods.com',
    'Tyson:tysonfoods.com','JBS:jbs.com','Cargill:cargill.com','ADM:adm.com',
    'Bunge:bunge.com','Ingredion:ingredion.com','Kerry Group:kerry.com',
    'IFF:iff.com','Givaudan:givaudan.com','Symrise:symrise.com',
    'Danone:danone.com','Fonterra:fonterra.com','Saputo:saputo.com','Lactalis:lactalis.com',
    'Arla Foods:arla.com','FrieslandCampina:frieslandcampina.com',
    'AB InBev:ab-inbev.com','Heineken:theheinekencompany.com','Diageo:diageo.com',
    'Pernod Ricard:pernod-ricard.com','Brown-Forman:brown-forman.com',
    'McCormick:mccormick.com','Hershey:thehersheycompany.com','Ferrero:ferrero.com',
    'Lindt:lindt.com','Barry Callebaut:barry-callebaut.com','Olam:olamgroup.com',
    'Buhler:buhlergroup.com','GEA Group:gea.com','Tetra Pak:tetrapak.com',
    'Sidel:sidel.com','Krones:krones.com','KHS:khs.com','CFT:cfrgroup.com',
  ],
  'Energy': [
    'ExxonMobil:exxonmobil.com','Chevron:chevron.com','Shell:shell.com','BP:bp.com',
    'TotalEnergies:totalenergies.com','ConocoPhillips:conocophillips.com',
    'EOG Resources:eogresources.com','Pioneer Natural:pxd.com','Devon Energy:devonenergy.com',
    'Halliburton:halliburton.com','Schlumberger:slb.com','Baker Hughes:bakerhughes.com',
    'NOV:nov.com','TechnipFMC:technipfmc.com','Weatherford:weatherford.com',
    'NextEra Energy:nexteraenergy.com','Duke Energy:duke-energy.com','Southern Company:southerncompany.com',
    'Dominion Energy:dominionenergy.com','AES:aes.com','Enphase:enphase.com',
    'SolarEdge:solaredge.com','First Solar:firstsolar.com','SunPower:sunpower.com',
    'Canadian Solar:canadiansolar.com','JinkoSolar:jinkosolar.com','Trina Solar:trinasolar.com',
    'LONGi Green:longi.com','Vestas:vestas.com','Siemens Gamesa:siemensgamesa.com',
    'GE Renewable:gerenewableenergy.com','Goldwind:goldwind.com','Envision:envision-group.com',
    'Bloom Energy:bloomenergy.com','Plug Power:plugpower.com','Ballard Power:ballard.com',
    'Nel Hydrogen:nelhydrogen.com','ITM Power:itm-power.com','Cummins:cummins.com',
    'Wärtsilä:wartsila.com','MAN Energy:man-es.com','Rolls-Royce Power:rolls-royce.com',
  ],
  'Construction': [
    'Caterpillar:cat.com','John Deere:deere.com','Komatsu:komatsu.com','Volvo CE:volvoce.com',
    'Liebherr:liebherr.com','Hitachi Construction:hitachicm.com','JCB:jcb.com',
    'CASE:casece.com','Kubota:kubota.com','Bobcat:bobcat.com','Takeuchi:takeuchi-us.com',
    'Manitou:manitou.com','Terex:terex.com','Sany:sanyamerica.com','XCMG:xcmg.com',
    'Zoomlion:zoomlion.com','Hilti:hilti.com','Makita:makitatools.com','DeWalt:dewalt.com',
    'Milwaukee Tool:milwaukeetool.com','Bosch Power:boschtools.com','Stanley Black:stanleyblackanddecker.com',
    'Trimble:trimble.com','Topcon:topconpositioning.com','Leica Geosystems:leica-geosystems.com',
    'CEMEX:cemex.com','LafargeHolcim:lafargeholcim.com','HeidelbergCement:heidelbergcement.com',
    'CRH:crh.com','Martin Marietta:martinmarietta.com','Vulcan Materials:vulcanmaterials.com',
    'Summit Materials:summit-materials.com','US Concrete:us-concrete.com',
    'Procore:procore.com','PlanGrid:plangrid.com','Bluebeam:bluebeam.com',
  ],
  'Automotive': [
    'Toyota:toyota.com','Volkswagen:volkswagen.com','General Motors:gm.com','Ford:ford.com',
    'Stellantis:stellantis.com','Honda:honda.com','Nissan:nissan-global.com','Hyundai:hyundai.com',
    'BMW:bmw.com','Mercedes-Benz:mercedes-benz.com','Tesla:tesla.com','Rivian:rivian.com',
    'Lucid:lucidmotors.com','BYD:byd.com','NIO:nio.com','XPeng:xpeng.com','Li Auto:lixiang.com',
    'Bosch:bosch.com','Continental:continental.com','Denso:denso.com','Aisin:aisin.com',
    'ZF:zf.com','Magna:magna.com','Aptiv:aptiv.com','BorgWarner:borgwarner.com',
    'Dana:dana.com','Lear:lear.com','Adient:adient.com','Gentex:gentex.com',
    'Modine:modine.com','Dorman:dormanproducts.com','Standard Motor:smpcorp.com',
    'LKQ:lkqcorp.com','AutoZone:autozone.com','OReilly:oreillyauto.com','Advance Auto:advanceautoparts.com',
    'NAPA:napaonline.com','Snap-on:snapon.com','Autoneum:autoneum.com','Faurecia:faurecia.com',
  ],
  'Defense Aerospace': [
    'Lockheed Martin:lockheedmartin.com','Boeing:boeing.com','RTX:rtx.com','Northrop Grumman:northropgrumman.com',
    'General Dynamics:gd.com','L3Harris:l3harris.com','BAE Systems:baesystems.com',
    'Leidos:leidos.com','SAIC:saic.com','Booz Allen:boozallen.com','ManTech:mantech.com',
    'CACI:caci.com','Parsons:parsons.com','KBR:kbr.com','Jacobs:jacobs.com',
    'Textron:textron.com','Curtiss-Wright:curtisswright.com','Heico:heico.com',
    'TransDigm:transdigm.com','Woodward:woodward.com','Moog:moog.com','Ducommun:ducommun.com',
    'Mercury Systems:mrcy.com','Kratos:kratosdefense.com','AeroJet:aerojetrocketdyne.com',
    'Spirit AeroSystems:spiritaero.com','Howmet:howmet.com','Hexcel:hexcel.com',
    'Teledyne:teledyne.com','FLIR Systems:flir.com','Leonardo DRS:leonardodrs.com',
    'Elbit Systems:elbitsystems.com','Rafael:rafael.co.il','Thales:thalesgroup.com',
    'Safran:safran-group.com','Airbus:airbus.com','Dassault Aviation:dassault-aviation.com',
  ],
  'Retail Consumer': [
    'Walmart:walmart.com','Target:target.com','Costco:costco.com','Kroger:kroger.com',
    'Amazon:amazon.com','Shopify:shopify.com','BigCommerce:bigcommerce.com',
    'Magento:magento.com','WooCommerce:woocommerce.com','Squarespace:squarespace.com',
    'Wix:wix.com','Etsy:etsy.com','eBay:ebay.com','Wayfair:wayfair.com',
    'Chewy:chewy.com','Dollar General:dollargeneral.com','Dollar Tree:dollartree.com',
    'Five Below:fivebelow.com','TJX:tjx.com','Ross:rossstores.com','Burlington:burlington.com',
    'Nike:nike.com','Adidas:adidas.com','Under Armour:underarmour.com','Lululemon:lululemon.com',
    'Procter & Gamble:pg.com','Colgate:colgatepalmolive.com','Church Dwight:churchdwight.com',
    'Henkel:henkel.com','Reckitt:reckitt.com','SC Johnson:scjohnson.com',
    'Revlon:revlon.com','Estee Lauder:esteelauder.com','LOreal:loreal.com','Shiseido:shiseido.com',
    'Coty:coty.com','Edgewell:edgewell.com','Energizer:energizer.com','Spectrum Brands:spectrumbrands.com',
  ],
  'Hospitality': [
    'Marriott:marriott.com','Hilton:hilton.com','IHG:ihg.com','Hyatt:hyatt.com',
    'Wyndham:wyndhamhotels.com','Choice Hotels:choicehotels.com','Best Western:bestwestern.com',
    'Radisson:radissonhotels.com','Accor:accor.com','Four Seasons:fourseasons.com',
    'Ritz-Carlton:ritzcarlton.com','Mandarin Oriental:mandarinoriental.com',
    'Fairmont:fairmont.com','Omni Hotels:omnihotels.com','Loews:loewshotels.com',
    'MGM Resorts:mgmresorts.com','Caesars:caesars.com','Las Vegas Sands:sands.com',
    'Wynn:wynnresorts.com','Hard Rock:hardrockhotels.com',
  ],
  'Telecom': [
    'AT&T:att.com','Verizon:verizon.com','T-Mobile:t-mobile.com','Comcast:comcast.com',
    'Charter:charter.com','Lumen:lumen.com','Frontier:frontier.com',
    'Ericsson:ericsson.com','Nokia:nokia.com','Huawei:huawei.com','ZTE:zte.com.cn',
    'Motorola Solutions:motorolasolutions.com','Juniper:juniper.net','Arista:arista.com',
    'Ciena:ciena.com','Calix:calix.com','ADTRAN:adtran.com','Ribbon:ribboncommunications.com',
    'CommScope:commscope.com','Corning:corning.com','Amphenol:amphenol.com','TE Connectivity:te.com',
  ],
  'Financial Services': [
    'JPMorgan:jpmorgan.com','Goldman Sachs:goldmansachs.com','Morgan Stanley:morganstanley.com',
    'Bank of America:bankofamerica.com','Citigroup:citi.com','Wells Fargo:wellsfargo.com',
    'US Bancorp:usbank.com','Truist:truist.com','PNC:pnc.com','Capital One:capitalone.com',
    'American Express:americanexpress.com','Discover:discover.com','Mastercard:mastercard.com',
    'Visa:visa.com','PayPal:paypal.com','Square:squareup.com','Stripe:stripe.com',
    'Fidelity:fidelity.com','Charles Schwab:schwab.com','BlackRock:blackrock.com',
    'Vanguard:vanguard.com','State Street:statestreet.com','BNY Mellon:bnymellon.com',
    'Northern Trust:northerntrust.com','Fiserv:fiserv.com','FIS:fisglobal.com',
    'Jack Henry:jackhenry.com','Temenos:temenos.com','Finastra:finastra.com',
    'SS&C:ssctech.com','Broadridge:broadridge.com','FactSet:factset.com',
  ],
  'Pharma Biotech': [
    'Pfizer:pfizer.com','Merck:merck.com','AbbVie:abbvie.com','Eli Lilly:lilly.com',
    'Bristol-Myers:bms.com','Amgen:amgen.com','Gilead:gilead.com','Regeneron:regeneron.com',
    'Vertex:vrtx.com','Biogen:biogen.com','Moderna:modernatx.com','BioNTech:biontech.com',
    'Novavax:novavax.com','Illumina:illumina.com','Thermo Fisher:thermofisher.com',
    'Danaher:danaher.com','Agilent:agilent.com','Waters:waters.com','Bio-Rad:bio-rad.com',
    'PerkinElmer:perkinelmer.com','Bruker:bruker.com','Sartorius:sartorius.com',
    'Eppendorf:eppendorf.com','Beckman Coulter:beckmancoulter.com',
    'Roche:roche.com','Novartis:novartis.com','AstraZeneca:astrazeneca.com',
    'Sanofi:sanofi.com','GSK:gsk.com','Bayer:bayer.com','Takeda:takeda.com',
    'Daiichi Sankyo:daiichisankyo.com','Astellas:astellas.com','Eisai:eisai.com',
  ],
  'Logistics Supply Chain': [
    'FedEx:fedex.com','UPS:ups.com','DHL:dhl.com','XPO:xpo.com','JB Hunt:jbhunt.com',
    'Werner:werner.com','Schneider:schneider.com','Old Dominion:odfl.com','Saia:saia.com',
    'Ryder:ryder.com','Penske:penskelogistics.com','GEODIS:geodis.com',
    'DSV:dsv.com','Maersk:maersk.com','CMA CGM:cma-cgm.com','Hapag-Lloyd:hapag-lloyd.com',
    'Zebra Technologies:zebra.com','Manhattan Associates:manh.com','Blue Yonder:blueyonder.com',
    'Kinaxis:kinaxis.com','o9 Solutions:o9solutions.com','Coupa:coupa.com',
    'SAP Ariba:ariba.com','Jaggaer:jaggaer.com','GEP:gep.com',
    'Dematic:dematic.com','Daifuku:daifuku.com','SSI Schaefer:ssi-schaefer.com',
    'KNAPP:knapp.com','Swisslog:swisslog.com','AutoStore:autostoresystem.com',
    'Locus Robotics:locusrobotics.com','6 River:6river.com','Fetch Robotics:fetchrobotics.com',
  ],
  'Agriculture': [
    'John Deere:deere.com','CNH Industrial:cnhindustrial.com','AGCO:agcocorp.com',
    'Kubota:kubota.com','CLAAS:claas.com','Trimble Ag:trimble.com','Raven Industries:ravenind.com',
    'Climate Corp:climate.com','Corteva:corteva.com','Syngenta:syngenta.com',
    'BASF Ag:basf.com','Bayer CropScience:cropscience.bayer.com','FMC:fmc.com',
    'Nufarm:nufarm.com','UPL:upl-ltd.com','Valmont:valmont.com','Lindsay:lindsay.com',
    'Netafim:netafim.com','Toro:toro.com','Husqvarna:husqvarna.com',
  ],
  'Education EdTech': [
    'Pearson:pearson.com','McGraw Hill:mheducation.com','Cengage:cengage.com',
    'Houghton Mifflin:hmhco.com','Scholastic:scholastic.com','Kaplan:kaplan.com',
    'Blackboard:blackboard.com','Canvas:instructure.com','D2L:d2l.com','Moodle:moodle.com',
    'Coursera:coursera.org','Udemy:udemy.com','LinkedIn Learning:linkedin.com',
    'Pluralsight:pluralsight.com','Skillsoft:skillsoft.com','2U:2u.com',
    'Chegg:chegg.com','Quizlet:quizlet.com','Duolingo:duolingo.com','Kahoot:kahoot.com',
  ],
  'Packaging': [
    'Amcor:amcor.com','Berry Global:berryglobal.com','Sealed Air:sealedair.com',
    'Sonoco:sonoco.com','Graphic Packaging:graphicpkg.com','WestRock:westrock.com',
    'International Paper:internationalpaper.com','Packaging Corp:packagingcorp.com',
    'Silgan:silgan.com','Crown Holdings:crowncork.com','Ball:ball.com','Ardagh:ardaghgroup.com',
    'Pactiv:pactiv.com','Novolex:novolex.com','ProAmpac:proampac.com','TC Transcontinental:tc.tc',
    'Coveris:coveris.com','Constantia Flexibles:cflex.com','Huhtamaki:huhtamaki.com',
    'Tetra Pak:tetrapak.com','SIG:sig.biz','Elopak:elopak.com',
  ],
  'Chemicals': [
    'Dow:dow.com','DuPont:dupont.com','BASF:basf.com','LyondellBasell:lyondellbasell.com',
    'Celanese:celanese.com','Eastman:eastman.com','Huntsman:huntsman.com','RPM:rpminc.com',
    'Sherwin-Williams:sherwin-williams.com','PPG:ppg.com','Axalta:axalta.com',
    'Ashland:ashland.com','Cabot:cabotcorp.com','Chemours:chemours.com','Kronos:kronosww.com',
    'Air Products:airproducts.com','Linde:linde.com','Air Liquide:airliquide.com',
    'Praxair:praxair.com','Messer:messergroup.com','Ecolab:ecolab.com','Diversey:diversey.com',
    'Sealed Air:sealedair.com','Henkel:henkel.com',
  ],
  'Real Estate': [
    'CBRE:cbre.com','JLL:jll.com','Cushman Wakefield:cushmanwakefield.com',
    'Colliers:colliers.com','Newmark:nmrk.com','Marcus Millichap:marcusmillichap.com',
    'Prologis:prologis.com','Simon Property:simon.com','Brookfield:brookfield.com',
    'Hines:hines.com','Tishman Speyer:tishmanspeyer.com','Boston Properties:bxp.com',
    'Vornado:vno.com','SL Green:slgreen.com','Mack-Cali:mfreit.com',
    'CoStar:costar.com','Zillow:zillow.com','Redfin:redfin.com','Realogy:realogy.com',
    'RE/MAX:remax.com','Keller Williams:kw.com','Compass:compass.com',
  ],
  'Gaming Entertainment': [
    'Sony Interactive:playstation.com','Microsoft Gaming:xbox.com','Nintendo:nintendo.com',
    'Epic Games:epicgames.com','Unity:unity.com','Roblox:roblox.com','Electronic Arts:ea.com',
    'Activision:activision.com','Take-Two:take2games.com','Ubisoft:ubisoft.com',
    'Square Enix:square-enix.com','Bandai Namco:bandainamcoent.com','Capcom:capcom.com',
    'Sega:sega.com','Konami:konami.com','Warner Bros Games:warnerbros.com',
    'Razer:razer.com','Corsair:corsair.com','Logitech:logitech.com','SteelSeries:steelseries.com',
    'HyperX:hyperx.com','Turtle Beach:turtlebeach.com',
  ],
  'Pet Industry': [
    'Mars Petcare:mars.com','Nestle Purina:purina.com','Hills Pet:hillspet.com',
    'Blue Buffalo:bluebuffalo.com','Chewy:chewy.com','Petco:petco.com','PetSmart:petsmart.com',
    'BarkBox:barkbox.com','Freshpet:freshpet.com','Champion Petfoods:championpetfoods.com',
    'Central Garden Pet:central.com','Spectrum Brands:spectrumbrands.com',
    'Hartz:hartz.com','Nylabone:nylabone.com','Kong:kongcompany.com',
  ],
  'Beauty Cosmetics': [
    'LOreal:loreal.com','Estee Lauder:esteelauder.com','Procter Gamble Beauty:pg.com',
    'Shiseido:shiseido.com','Coty:coty.com','Revlon:revlon.com','Avon:avon.com',
    'Mary Kay:marykay.com','Amway:amway.com','Nu Skin:nuskin.com',
    'Ulta Beauty:ulta.com','Sephora:sephora.com','Sally Beauty:sallybeauty.com',
    'Henkel Beauty:henkel.com','Church Dwight Beauty:churchdwight.com',
    'Olaplex:olaplex.com','Drunk Elephant:drunkelephant.com',
  ],
  'Environmental Sustainability': [
    'Waste Management:wm.com','Republic Services:republicservices.com','Stericycle:stericycle.com',
    'Clean Harbors:cleanharbors.com','Veolia:veolia.com','Suez:suez.com',
    'Covanta:covanta.com','Casella Waste:casella.com','US Ecology:usecology.com',
    'TerraCycle:terracycle.com','Rubicon:rubicon.com','Ecovadis:ecovadis.com',
    'Schneider Electric:se.com','Johnson Controls:johnsoncontrols.com','Trane:trane.com',
    'Honeywell Building:honeywell.com','Siemens Smart:siemens.com',
    'Arcadis:arcadis.com','AECOM:aecom.com','WSP:wsp.com','Tetra Tech:tetratech.com',
  ],
};

// === EMAIL TEMPLATES (5 variants for A/B testing) ===
const TEMPLATES = [
  {
    id: 'sponsorship-v1',
    subject: '{{company}} + ShowFloorTips: Reach 50,000+ Trade Show Pros',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi ${c.company} Team,</p>
<p>I'm reaching out from <a href="https://showfloortips.com" style="color:#e94560">ShowFloorTips.com</a> — the largest independent trade show resource online with <strong>25,000+ articles</strong>, <strong>24,800+ show listings</strong>, and growing organic traffic from exhibitors and event professionals.</p>
<p>We offer premium sponsorship placements designed for companies in the <strong>${c.industry}</strong> space:</p>
<ul>
<li><strong>Featured Listing</strong> — priority placement on relevant show pages</li>
<li><strong>Sponsored Articles</strong> — dedicated content showcasing your brand</li>
<li><strong>Category Sponsorship</strong> — own an industry vertical</li>
<li><strong>Newsletter Features</strong> — reach our subscriber base directly</li>
</ul>
<p>Packages start at <strong>$1,500/month</strong>. Reply for our media kit with traffic data.</p>
<p>Best,<br><strong>ShowFloorTips Team</strong><br><a href="https://showfloortips.com" style="color:#e94560">showfloortips.com</a></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out of future emails, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
  {
    id: 'partnership-v2',
    subject: 'Partnership opportunity for {{company}} — trade show audience',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi there,</p>
<p>ShowFloorTips.com is the #1 independent trade show directory with 24,800+ shows and 25,000+ industry articles.</p>
<p>I noticed <strong>${c.company}</strong> operates in the ${c.industry} space — our audience of exhibitors, event managers, and procurement professionals would be a great fit.</p>
<p>We're currently partnering with select companies for <strong>sponsored visibility</strong> across our platform:</p>
<ul>
<li>Featured brand placement on show pages your customers visit</li>
<li>Custom content articles ranking in Google</li>
<li>Newsletter sponsorship to 10,000+ subscribers</li>
</ul>
<p>Would a quick partnership conversation make sense? Just reply here.</p>
<p>Cheers,<br><strong>ShowFloorTips Team</strong><br><a href="https://showfloortips.com/sponsor-with-us.html" style="color:#e94560">View Sponsorship Options</a></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
  {
    id: 'value-first-v3',
    subject: '{{company}} is listed on ShowFloorTips — want to upgrade?',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi ${c.company} Team,</p>
<p>Your company appears in our trade show database at <a href="https://showfloortips.com" style="color:#e94560">ShowFloorTips.com</a> — the web's largest independent show directory.</p>
<p>We'd love to offer you a <strong>premium listing upgrade</strong> that includes:</p>
<ul>
<li>Priority placement with logo on relevant show pages</li>
<li>Dedicated company profile with backlink to your site</li>
<li>Featured in our weekly newsletter (10,000+ subscribers)</li>
<li>Sponsored article highlighting your ${c.industry} expertise</li>
</ul>
<p>Bronze packages start at just <strong>$1,500/mo</strong> — less than a single trade show booth.</p>
<p>Reply for details or visit our <a href="https://showfloortips.com/sponsor-with-us.html" style="color:#e94560">sponsorship page</a>.</p>
<p>Best,<br><strong>ShowFloorTips Team</strong></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
  {
    id: 'direct-v4',
    subject: 'Quick question for {{company}}',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi,</p>
<p>Who handles marketing/sponsorship decisions at ${c.company}?</p>
<p>We run <a href="https://showfloortips.com" style="color:#e94560">ShowFloorTips.com</a> (25K+ articles, 24K+ show listings) and have sponsorship spots available in the ${c.industry} category.</p>
<p>Happy to send over details if there's interest.</p>
<p>Thanks,<br><strong>ShowFloorTips Team</strong></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
  {
    id: 'social-proof-v5',
    subject: 'Trade show companies are sponsoring ShowFloorTips — {{company}} next?',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi ${c.company} Team,</p>
<p>Trade show industry companies are partnering with <a href="https://showfloortips.com" style="color:#e94560">ShowFloorTips.com</a> to reach exhibitors actively researching shows, services, and vendors.</p>
<p>With <strong>25,000+ articles</strong> and <strong>24,800+ show listings</strong>, we're the largest independent trade show resource — and our audience maps perfectly to ${c.industry} buyers.</p>
<p><strong>What sponsors get:</strong></p>
<ul>
<li>Brand visibility on high-traffic show pages</li>
<li>SEO-optimized sponsored content</li>
<li>Newsletter placement (10K+ subscribers)</li>
<li>Category ownership opportunities</li>
</ul>
<p>Starting at $1,500/mo. Want to see our media kit?</p>
<p>Best,<br><strong>ShowFloorTips Team</strong><br><a href="https://showfloortips.com" style="color:#e94560">showfloortips.com</a></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
];

// === FOLLOW-UP TEMPLATES ===
const FOLLOWUPS = [
  {
    id: 'followup-1',
    day: 3,
    subject: 'Re: {{prevSubject}}',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi ${c.company} Team,</p>
<p>Just circling back on my note about sponsorship on ShowFloorTips.com. We have a few ${c.industry} category spots opening up and wanted to make sure you had a chance to review.</p>
<p>Happy to send our media kit with full traffic data — just reply here.</p>
<p>Best,<br><strong>ShowFloorTips Team</strong></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
  {
    id: 'followup-2',
    day: 7,
    subject: '{{company}} — limited sponsorship spots on ShowFloorTips',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi,</p>
<p>Quick update — we're finalizing our Q2 sponsor lineup for the ${c.industry} section on ShowFloorTips.com.</p>
<p>If ${c.company} wants to be in front of 50,000+ monthly trade show professionals, now's the time.</p>
<p><a href="https://showfloortips.com/sponsor-with-us.html" style="color:#e94560">View sponsorship details →</a></p>
<p>Best,<br><strong>ShowFloorTips Team</strong></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
  {
    id: 'followup-3',
    day: 14,
    subject: 'Last note from ShowFloorTips — {{company}}',
    html: (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi ${c.company} Team,</p>
<p>This is my last follow-up. If sponsorship on ShowFloorTips.com isn't the right fit right now, no worries at all.</p>
<p>If anything changes in the future, we'd love to chat: <a href="https://showfloortips.com/sponsor-with-us.html" style="color:#e94560">showfloortips.com/sponsor-with-us.html</a></p>
<p>All the best,<br><strong>ShowFloorTips Team</strong></p>
<p style="font-size:11px;color:#999;margin-top:30px">To opt out, reply "unsubscribe". ShowFloorTips, 1209 Mountain Road Pl NE, Albuquerque, NM 87110</p>
</div>`
  },
];

// === UTILITY FUNCTIONS ===
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadState() {
  try { return JSON.parse(fs.readFileSync(CONFIG.STATE_FILE, 'utf8')); }
  catch { return { totalGenerated: 0, totalSent: 0, totalBounced: 0, totalReplied: 0, sentToday: 0, lastSendDate: '', sentDomains: [], unsubscribed: [] }; }
}

function saveState(state) {
  fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
}

function appendLead(lead) {
  fs.appendFileSync(CONFIG.LEADS_FILE, JSON.stringify(lead) + '\n');
}

function appendSent(record) {
  fs.appendFileSync(CONFIG.SENT_LOG, JSON.stringify(record) + '\n');
}

function readLeads() {
  try {
    const lines = fs.readFileSync(CONFIG.LEADS_FILE, 'utf8').trim().split('\n').filter(Boolean);
    return lines.map(l => JSON.parse(l));
  } catch { return []; }
}

function readSentLog() {
  try {
    const lines = fs.readFileSync(CONFIG.SENT_LOG, 'utf8').trim().split('\n').filter(Boolean);
    return lines.map(l => JSON.parse(l));
  } catch { return []; }
}

function sendEmailAPI(to, subject, html) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ from: CONFIG.FROM, to: [to], subject, html });
    const options = {
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(res.statusCode < 300 ? { success: true, id: result.id } : { success: false, error: result.message || body });
        } catch { resolve({ success: false, error: body }); }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(payload);
    req.end();
  });
}

// === GENERATE COMMAND ===
async function generateLeads() {
  const state = loadState();
  const existing = readLeads();
  const existingDomains = new Set(existing.map(l => l.domain));

  // Also exclude previously sent domains from CLAUDE.md outreach
  const previousDomains = new Set([...existingDomains, ...(state.sentDomains || [])]);

  let added = 0;
  const emailPrefixes = ['info', 'contact', 'sales', 'hello', 'marketing'];

  for (const [industry, companies] of Object.entries(SEEDS)) {
    for (const entry of companies) {
      const [company, domain] = entry.split(':');
      if (previousDomains.has(domain)) continue;

      // Generate multiple email variants per company
      for (const prefix of emailPrefixes) {
        const email = `${prefix}@${domain}`;
        const lead = {
          id: `${domain}-${prefix}`,
          company: company.trim(),
          email,
          domain,
          industry,
          status: 'pending',
          score: 0,
          template: null,
          followups: 0,
          created: new Date().toISOString().split('T')[0],
        };
        appendLead(lead);
        added++;
      }
      previousDomains.add(domain);
    }
  }

  state.totalGenerated = (state.totalGenerated || 0) + added;
  saveState(state);

  const totalLeads = readLeads().length;
  console.log(`\n=== LEAD GENERATION COMPLETE ===`);
  console.log(`New leads added: ${added}`);
  console.log(`Total leads in database: ${totalLeads}`);
  console.log(`Industries covered: ${Object.keys(SEEDS).length}`);
  console.log(`Unique companies: ${Math.floor(added / emailPrefixes.length)}`);
  console.log(`\nEmail variants per company: ${emailPrefixes.join(', ')}`);
  console.log(`\nRun "node million-email-pipeline.js send" to start sending.`);
}

// === SEND COMMAND ===
async function sendBatch(limit) {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];

  // Reset daily counter if new day
  if (state.lastSendDate !== today) {
    state.sentToday = 0;
    state.lastSendDate = today;
  }

  const remaining = (limit || CONFIG.DAILY_LIMIT) - state.sentToday;
  if (remaining <= 0) {
    console.log(`Daily limit reached (${CONFIG.DAILY_LIMIT}). Try again tomorrow.`);
    return;
  }

  const leads = readLeads();
  const sentLog = readSentLog();
  const sentEmails = new Set(sentLog.map(s => s.email));
  const unsubscribed = new Set(state.unsubscribed || []);

  // Filter to only pending leads not yet sent, not unsubscribed
  // Send only ONE email per domain (the first variant: info@)
  const sentDomains = new Set(sentLog.map(s => s.domain));
  const pendingLeads = leads.filter(l =>
    l.status === 'pending' &&
    !sentEmails.has(l.email) &&
    !unsubscribed.has(l.domain) &&
    !sentDomains.has(l.domain) &&
    l.email.startsWith('info@') // Send info@ first, then try others if bounced
  );

  const batch = pendingLeads.slice(0, remaining);

  if (batch.length === 0) {
    console.log('No pending leads to send. Run "generate" to add more.');
    return;
  }

  console.log(`\n=== SENDING BATCH: ${batch.length} emails ===`);
  console.log(`Daily progress: ${state.sentToday}/${CONFIG.DAILY_LIMIT}\n`);

  let sent = 0, failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];

    // Pick template (rotate through them)
    const template = TEMPLATES[i % TEMPLATES.length];
    const subject = template.subject.replace('{{company}}', lead.company);
    const html = template.html(lead);

    const result = await sendEmailAPI(lead.email, subject, html);

    if (result.success) {
      sent++;
      state.sentToday++;
      state.totalSent = (state.totalSent || 0) + 1;
      if (!state.sentDomains) state.sentDomains = [];
      state.sentDomains.push(lead.domain);

      appendSent({
        email: lead.email,
        domain: lead.domain,
        company: lead.company,
        industry: lead.industry,
        template: template.id,
        sentAt: new Date().toISOString(),
        resendId: result.id,
        followups: 0,
        status: 'sent',
      });

      console.log(`[${i+1}/${batch.length}] OK  ${lead.company} (${lead.email})`);
    } else {
      failed++;
      state.totalBounced = (state.totalBounced || 0) + 1;
      console.log(`[${i+1}/${batch.length}] ERR ${lead.company} (${lead.email}) — ${result.error}`);
    }

    if (i < batch.length - 1) await sleep(CONFIG.BATCH_DELAY_MS);
  }

  saveState(state);

  console.log(`\n=== BATCH COMPLETE ===`);
  console.log(`Sent: ${sent} | Failed: ${failed}`);
  console.log(`Daily total: ${state.sentToday}/${CONFIG.DAILY_LIMIT}`);
  console.log(`All-time total: ${state.totalSent}`);
}

// === FOLLOW-UP COMMAND ===
async function sendFollowups() {
  const state = loadState();
  const sentLog = readSentLog();
  const now = Date.now();
  const unsubscribed = new Set(state.unsubscribed || []);

  // Find contacts needing follow-up
  const needFollowup = sentLog.filter(s => {
    if (s.status === 'replied' || s.status === 'unsubscribed') return false;
    if (unsubscribed.has(s.domain)) return false;

    const daysSinceSent = (now - new Date(s.sentAt).getTime()) / (1000 * 60 * 60 * 24);
    const nextFollowup = FOLLOWUPS[s.followups];

    return nextFollowup && daysSinceSent >= nextFollowup.day;
  });

  if (needFollowup.length === 0) {
    console.log('No follow-ups needed right now.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  if (state.lastSendDate !== today) { state.sentToday = 0; state.lastSendDate = today; }

  const remaining = CONFIG.DAILY_LIMIT - state.sentToday;
  const batch = needFollowup.slice(0, Math.min(remaining, 30)); // Max 30 follow-ups per run

  console.log(`\n=== SENDING ${batch.length} FOLLOW-UPS ===\n`);

  let sent = 0;
  for (let i = 0; i < batch.length; i++) {
    const record = batch[i];
    const followupTemplate = FOLLOWUPS[record.followups];

    const subject = followupTemplate.subject
      .replace('{{prevSubject}}', `Sponsorship - ShowFloorTips.com`)
      .replace('{{company}}', record.company);
    const html = followupTemplate.html({ company: record.company, industry: record.industry });

    const result = await sendEmailAPI(record.email, subject, html);

    if (result.success) {
      sent++;
      state.sentToday++;
      record.followups++;
      record.lastFollowup = new Date().toISOString();
      console.log(`[${i+1}/${batch.length}] FU${record.followups} ${record.company} (${record.email})`);
    } else {
      console.log(`[${i+1}/${batch.length}] ERR ${record.company} — ${result.error}`);
    }

    if (i < batch.length - 1) await sleep(CONFIG.BATCH_DELAY_MS);
  }

  // Update sent log with follow-up counts
  const updatedLines = sentLog.map(s => JSON.stringify(s)).join('\n') + '\n';
  fs.writeFileSync(CONFIG.SENT_LOG, updatedLines);
  saveState(state);

  console.log(`\n=== FOLLOW-UPS COMPLETE: ${sent} sent ===`);
}

// === STATUS COMMAND ===
function showStatus() {
  const state = loadState();
  const leads = readLeads();
  const sentLog = readSentLog();

  const pending = leads.filter(l => l.status === 'pending').length;
  const sentDomains = new Set(sentLog.map(s => s.domain));
  const unsent = leads.filter(l => l.email.startsWith('info@') && !sentDomains.has(l.domain)).length;

  // Industry breakdown
  const byIndustry = {};
  leads.forEach(l => { byIndustry[l.industry] = (byIndustry[l.industry] || 0) + 1; });

  const today = new Date().toISOString().split('T')[0];
  const sentToday = state.lastSendDate === today ? state.sentToday : 0;

  console.log(`
╔══════════════════════════════════════════════════╗
║       ShowFloorTips Million-Email Pipeline        ║
╠══════════════════════════════════════════════════╣
║  Total Leads:      ${String(leads.length).padStart(8)}                     ║
║  Unique Companies: ${String(sentDomains.size + unsent).padStart(8)}                     ║
║  Emails Sent:      ${String(state.totalSent || 0).padStart(8)}                     ║
║  Bounced:          ${String(state.totalBounced || 0).padStart(8)}                     ║
║  Unsent Companies: ${String(unsent).padStart(8)}                     ║
║  Sent Today:       ${String(sentToday).padStart(8)} / ${CONFIG.DAILY_LIMIT}              ║
║  Unsubscribed:     ${String((state.unsubscribed || []).length).padStart(8)}                     ║
╠══════════════════════════════════════════════════╣
║  At ${CONFIG.DAILY_LIMIT}/day: ~${Math.ceil(unsent / CONFIG.DAILY_LIMIT)} days to send all              ║
║  At 1,667/day (Pro): ~${Math.ceil(unsent / 1667)} days to send all          ║
╚══════════════════════════════════════════════════╝
`);

  console.log('Industry Breakdown:');
  Object.entries(byIndustry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([industry, count]) => {
      console.log(`  ${industry.padEnd(28)} ${count} leads`);
    });

  console.log(`\nFree tier: 95/day (Resend free)`);
  console.log(`Pro tier ($20/mo): ~1,667/day = 50K/month`);
  console.log(`To reach 1M: generate more leads with web scraping\n`);
}

// === HOT LEADS COMMAND ===
function showHotLeads() {
  const sentLog = readSentLog();

  // Score leads based on engagement signals
  // For now, leads that were successfully sent get base score
  // In production, this would check Resend webhooks for opens/clicks/replies
  const scored = sentLog
    .filter(s => s.status === 'sent' || s.status === 'delivered')
    .map(s => ({
      ...s,
      score: 10 + (s.followups || 0) * 5, // Base score, increases with follow-up tracking
      daysSinceSent: Math.floor((Date.now() - new Date(s.sentAt).getTime()) / (1000*60*60*24)),
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`\n=== HOT LEADS REPORT ===`);
  console.log(`Total contacted: ${scored.length}\n`);

  if (scored.length === 0) {
    console.log('No leads sent yet. Run "send" to start outreach.');
    return;
  }

  console.log('To track opens/clicks/replies, set up Resend webhooks at:');
  console.log('https://resend.com/webhooks → point to your server\n');

  // Show recently sent (most likely to reply)
  const recent = scored.filter(s => s.daysSinceSent <= 7).slice(0, 20);
  console.log(`--- Recently Contacted (last 7 days) ---`);
  recent.forEach((s, i) => {
    console.log(`  ${i+1}. ${s.company} (${s.industry}) — ${s.email} — ${s.daysSinceSent}d ago`);
  });

  // Show needs follow-up
  const needsFollowup = scored.filter(s => s.daysSinceSent >= 3 && (s.followups || 0) < 3);
  console.log(`\n--- Needs Follow-up (${needsFollowup.length} contacts) ---`);
  needsFollowup.slice(0, 10).forEach((s, i) => {
    console.log(`  ${i+1}. ${s.company} — ${s.daysSinceSent}d ago, ${s.followups || 0} follow-ups sent`);
  });
}

// === DAILY COMMAND ===
async function dailyCycle() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  DAILY CYCLE — ${new Date().toISOString().split('T')[0]}`);
  console.log(`${'='.repeat(50)}\n`);

  // Step 1: Send new emails
  console.log('--- Step 1: Sending new outreach ---');
  await sendBatch(70); // Reserve 25 for follow-ups

  // Step 2: Send follow-ups
  console.log('\n--- Step 2: Sending follow-ups ---');
  await sendFollowups();

  // Step 3: Show status
  console.log('\n--- Step 3: Pipeline Status ---');
  showStatus();

  console.log('\nDaily cycle complete. Run again tomorrow or set up a cron job:');
  console.log(`  crontab -e → 0 9 * * 1-5 cd "${__dirname}" && node million-email-pipeline.js daily`);
}

// === CLI ENTRY POINT ===
async function main() {
  const cmd = process.argv[2];
  const arg = process.argv[3];

  switch (cmd) {
    case 'generate':
      await generateLeads();
      break;
    case 'send':
      await sendBatch(arg ? parseInt(arg) : undefined);
      break;
    case 'followup':
      await sendFollowups();
      break;
    case 'status':
      showStatus();
      break;
    case 'hotleads':
      showHotLeads();
      break;
    case 'daily':
      await dailyCycle();
      break;
    default:
      console.log(`
ShowFloorTips Million-Email Pipeline
=====================================

Commands:
  generate        Build lead database from 30+ industry seeds (~5,000+ leads)
  send [count]    Send email batch (default: ${CONFIG.DAILY_LIMIT}/day)
  followup        Send follow-up emails to non-responders
  status          View pipeline dashboard
  hotleads        View scored leads and engagement
  daily           Run full daily cycle (send + followup + status)

Scaling to 1M:
  Free tier (Resend): 95 emails/day = 2,850/month
  Pro tier ($20/mo):  1,667/day = 50,000/month = 1M in 20 months

  Generate more leads by adding companies to SEEDS in the script,
  or expand the generate command to scrape exhibitor directories.

Quick Start:
  1. node million-email-pipeline.js generate
  2. node million-email-pipeline.js send
  3. node million-email-pipeline.js daily  (run daily via cron)
`);
  }
}

main().catch(console.error);
